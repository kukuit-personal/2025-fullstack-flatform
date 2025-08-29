import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { SearchEmailTemplatesDto } from './dto/search-email-templates.dto';
import { ulid } from 'ulid';
import { Prisma } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import * as fsp from 'fs/promises';

const STATUS_DISABLED = 0;
const STATUS_ACTIVE = 1;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// ====== Storage config (public base + storage root) ======
const STORAGE_DIR = process.env.STORAGE_DIR || 'storage';
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

// ====== File helpers ======
async function pathExists(p: string) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}
async function ensureDir(dir: string) {
  if (!(await pathExists(dir))) await fsp.mkdir(dir, { recursive: true });
}
function sanitizeName(name: string) {
  return name.normalize('NFKD').replace(/[^\w.-]+/g, '_');
}
function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
async function ensureUniqueFilename(dir: string, filename: string) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = filename;
  let i = 1;
  while (await pathExists(path.join(dir, candidate))) {
    candidate = `${base}-${i}${ext || ''}`;
    i++;
  }
  return candidate;
}
async function safeRenameOrCopy(src: string, dest: string) {
  try {
    await fsp.rename(src, dest);
  } catch (e: any) {
    if (e?.code === 'EXDEV') {
      // khác partition: copy + unlink
      await fsp.copyFile(src, dest);
      await fsp.unlink(src);
    } else {
      throw e;
    }
  }
}

/**
 * Move tất cả ảnh thuộc tmp/<draftId>/images → templates/<templateId>/images
 * và rewrite url/filename trực tiếp trên mảng images (tham chiếu).
 */
async function moveDraftImagesAndRewriteUrls(
  draftId: string,
  templateId: string,
  images: Array<{ url: string; filename?: string | null }>,
): Promise<Map<string, string>> {
  const srcDir = path.join(
    process.cwd(),
    STORAGE_DIR,
    'tmp',
    draftId,
    'images',
  );
  const dstDir = path.join(
    process.cwd(),
    STORAGE_DIR,
    'templates',
    templateId,
    'images',
  );
  await ensureDir(dstDir);

  const tmpPrefix = `${PUBLIC_BASE}/assets/tmp/${draftId}/images/`;
  const urlMap = new Map<string, string>();

  for (const img of images) {
    if (!img?.url?.startsWith(tmpPrefix)) continue;
    const oldUrl = img.url;

    const originalName =
      img.filename || img.url.replace(tmpPrefix, '') || 'image';
    const safeName = sanitizeName(originalName);
    const finalName = await ensureUniqueFilename(dstDir, safeName);

    const srcPath = path.join(srcDir, safeName);
    const dstPath = path.join(dstDir, finalName);

    if (!(await pathExists(srcPath))) {
      const fromUrlName = sanitizeName(path.basename(img.url));
      const altSrc = path.join(srcDir, fromUrlName);
      if (await pathExists(altSrc)) {
        await safeRenameOrCopy(altSrc, dstPath);
      } else {
        continue;
      }
    } else {
      await safeRenameOrCopy(srcPath, dstPath);
    }

    const newUrl = `${PUBLIC_BASE}/assets/templates/${templateId}/images/${finalName}`;
    img.filename = finalName;
    img.url = newUrl;

    urlMap.set(oldUrl, newUrl);
  }

  // dọn tmp nếu trống (best-effort)
  try {
    const left = await fsp.readdir(srcDir);
    if (!left.length) {
      await fsp.rm(srcDir, { recursive: false, force: true }).catch(() => {});
      await fsp
        .rm(path.dirname(srcDir), { recursive: false, force: true })
        .catch(() => {});
    }
  } catch {}

  return urlMap;
}

type Actor = { id: string; role?: string };

@Injectable()
export class EmailTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // Helpers
  // =========================
  private isAdmin(actor: Actor) {
    return actor?.role === 'admin';
  }

  /**
   * Điều kiện access cho user thường (không phải admin):
   * - Là chủ sở hữu (userId = actor.id), hoặc
   * - Được share (shares.some({ sharedWith = actor.id }))
   */
  private accessWhere(actor: Actor) {
    return {
      OR: [
        { userId: actor.id },
        { shares: { some: { sharedWith: actor.id } } },
      ],
    };
  }

  private ensureCanEditTemplate(actor: Actor, tmpl: any) {
    if (this.isAdmin(actor)) return; // admin luôn được quyền
    const isOwner = tmpl.userId === actor.id;
    const shared = (tmpl.shares || []) as Array<{
      sharedWith: string;
      permission: string;
    }>;
    const canEditByShare = shared.some(
      (s) =>
        s.sharedWith === actor.id &&
        (s.permission === 'EDIT' || s.permission === 'OWNER'),
    );
    if (!isOwner && !canEditByShare) {
      throw new ForbiddenException(
        'You do not have permission to modify this template.',
      );
    }
  }

  private ensureCanViewTemplate(actor: Actor, tmpl: any) {
    if (this.isAdmin(actor)) return; // admin luôn được quyền
    const isOwner = tmpl.userId === actor.id;
    const shared = (tmpl.shares || []) as Array<{ sharedWith: string }>;
    const canViewByShare = shared.some((s) => s.sharedWith === actor.id);
    if (!isOwner && !canViewByShare) {
      throw new ForbiddenException(
        'You do not have permission to view this template.',
      );
    }
  }

  private handlePrismaError(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: unique constraint failed (ví dụ slug)
      if (e.code === 'P2002') {
        const tgt = e.meta?.target as unknown;
        const targets = Array.isArray(tgt) ? tgt : [String(tgt ?? '')];
        const isSlug = targets.some((t) =>
          String(t).toLowerCase().includes('slug'),
        );
        if (isSlug) {
          throw new ConflictException(
            'Slug đã tồn tại. Vui lòng chọn slug khác.',
          );
        }
        throw new ConflictException(
          `Dữ liệu bị trùng (unique): ${targets.filter(Boolean).join(', ')}`,
        );
      }
    }
    throw e;
  }

  // =========================
  // Create (UPDATED: tmp/<draftId> → templates/<templateId>)
  // =========================
  async create(actor: Actor, dto: CreateEmailTemplateDto) {
    try {
      if (dto.images?.length) {
        const tooLarge = dto.images.find(
          (img) =>
            typeof img.bytes === 'number' && img.bytes! > MAX_IMAGE_BYTES,
        );
        if (tooLarge) {
          throw new BadRequestException(
            `Image "${tooLarge.filename ?? tooLarge.url}" exceeds 5MB limit`,
          );
        }
      }

      return await this.prisma.$transaction(async (tx) => {
        // 1) Tạo template (tạm lưu html gốc)
        const tmpl = await tx.emailTemplate.create({
          data: {
            id: ulid(),
            userId: actor.id,
            statusId: STATUS_ACTIVE,
            name: dto.name,
            slug: dto.slug ?? null,
            description: dto.description ?? '',
            html: dto.html, // ⬅ html gốc
            hasImages: dto.hasImages ?? Boolean(dto.images?.length),
            price: dto.price ?? 0,
            currency: dto.currency ?? 'USD',
            customerId: dto.customerId ?? null,
          },
        });

        // 2) Move ảnh từ tmp → templates và lấy urlMap
        const images = Array.isArray(dto.images) ? [...dto.images] : [];
        let urlMap = new Map<string, string>();
        if (dto.draftId && images.length) {
          urlMap = await moveDraftImagesAndRewriteUrls(
            dto.draftId,
            tmpl.id,
            images,
          );
        }

        // 3) Nếu có map, rewrite lại HTML và update trong cùng transaction
        if (urlMap.size > 0) {
          let finalHtml = dto.html;
          for (const [oldUrl, newUrl] of urlMap.entries()) {
            finalHtml = finalHtml.replace(
              new RegExp(escapeRegExp(oldUrl), 'g'),
              newUrl,
            );
          }
          await tx.emailTemplate.update({
            where: { id: tmpl.id },
            data: { html: finalHtml },
          });
        }

        // 4) Lưu metadata ảnh
        if (images.length) {
          await tx.emailTpImage.createMany({
            data: images.map((img) => ({
              id: ulid(),
              templateId: tmpl.id,
              url: img.url,
              filename: img.filename ?? (img.url.split('/').pop() || null),
              mimeType: (img as any).mimeType ?? null,
              width: (img as any).width ?? null,
              height: (img as any).height ?? null,
              bytes: (img as any).bytes ?? null,
            })),
            skipDuplicates: true,
          });
        }

        return tmpl;
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  // =========================
  // Search / List
  // =========================
  async search(actor: Actor, query: SearchEmailTemplatesDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const keyword =
      (query as any).keyword?.trim() || (query as any).q?.trim() || undefined;

    const baseWhere: any = {
      ...(keyword && {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { slug: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          // { html: { contains: keyword, mode: 'insensitive' } }, // nếu cần
        ],
      }),
      ...((query as any).statusId && {
        statusId: Number((query as any).statusId),
      }),
    };

    // admin -> bỏ qua owner/shared; user thường -> thêm accessWhere
    const where = this.isAdmin(actor)
      ? baseWhere
      : { AND: [baseWhere, this.accessWhere(actor)] };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.emailTemplate.count({ where }),
      this.prisma.emailTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          shares: true,
          creator: { select: { id: true, email: true } }, // quan hệ user theo schema
        },
      }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // =========================
  // Get one
  // =========================
  async findOne(actor: Actor, id: string) {
    const tmpl = await this.prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        shares: true,
        creator: { select: { id: true, email: true } },
      },
    });
    if (!tmpl) throw new NotFoundException('Template not found');

    this.ensureCanViewTemplate(actor, tmpl);
    return tmpl;
  }

  // =========================
  // Update
  // =========================
  async update(actor: Actor, id: string, dto: UpdateEmailTemplateDto) {
    const tmpl = await this.prisma.emailTemplate.findUnique({
      where: { id },
      include: { shares: true },
    });
    if (!tmpl) throw new NotFoundException('Template not found');

    this.ensureCanEditTemplate(actor, tmpl);

    try {
      return await this.prisma.emailTemplate.update({
        where: { id },
        data: { ...dto },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  // =========================
  // Soft delete
  // =========================
  async softDelete(actor: Actor, id: string) {
    const tmpl = await this.prisma.emailTemplate.findUnique({
      where: { id },
      include: { shares: true },
    });
    if (!tmpl) throw new NotFoundException('Template not found');

    this.ensureCanEditTemplate(actor, tmpl);

    await this.prisma.emailTemplate.update({
      where: { id },
      data: { statusId: STATUS_DISABLED },
    });
  }
}
