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
import * as fsp from 'fs/promises';
import slugify from 'slugify';
import * as cheerio from 'cheerio'; // 🆕 dùng để rewrite <img src>

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

/**
 * Move/copy thumbnail từ tmp/<draftId>/thumbnail(.jpg|x600.jpg)
 * sang templates/<templateId>/ và trả URL final để lưu DB.
 */
async function moveDraftThumbnails(
  draftId: string,
  templateId: string,
): Promise<{ url200?: string; url600?: string }> {
  const srcDir = path.join(process.cwd(), STORAGE_DIR, 'tmp', draftId);
  const dstDir = path.join(process.cwd(), STORAGE_DIR, 'templates', templateId);
  await ensureDir(dstDir);

  const src200 = path.join(srcDir, 'thumbnail.jpg');
  const src600 = path.join(srcDir, 'thumbnailx600.jpg');

  // fallback paths
  const fallbackDir = path.join(
    process.cwd(),
    STORAGE_DIR,
    'templates',
    'no-thumbnail',
  );
  const fb200 = path.join(fallbackDir, 'thumbnail.jpg');
  const fb600 = path.join(fallbackDir, 'thumbnailx600.jpg');

  // destination paths
  const dst200 = path.join(dstDir, 'thumbnail.jpg');
  const dst600 = path.join(dstDir, 'thumbnailx600.jpg');

  const out: { url200?: string; url600?: string } = {};

  // ---- thumbnail 200 ----
  if (await pathExists(src200)) {
    await safeRenameOrCopy(src200, dst200);
    out.url200 = `${PUBLIC_BASE}/assets/templates/${templateId}/thumbnail.jpg`;
  } else if (await pathExists(fb200)) {
    await fsp.copyFile(fb200, dst200);
    out.url200 = `${PUBLIC_BASE}/assets/templates/${templateId}/thumbnail.jpg`;
  }

  // ---- thumbnail 600 ----
  if (await pathExists(src600)) {
    await safeRenameOrCopy(src600, dst600);
    out.url600 = `${PUBLIC_BASE}/assets/templates/${templateId}/thumbnailx600.jpg`;
  } else if (await pathExists(fb600)) {
    await fsp.copyFile(fb600, dst600);
    out.url600 = `${PUBLIC_BASE}/assets/templates/${templateId}/thumbnailx600.jpg`;
  }

  // ---- cleanup tmp/<draftId> nếu đã move/copy ít nhất 1 file ----
  if (out.url200 || out.url600) {
    try {
      await fsp.rm(srcDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }

  return out;
}

// 🆕 Cheerio-based rewrite: ưu tiên urlMap (old→new), fallback theo prefix tmp → templates
function rewriteHtmlImgSrcWithCheerio(
  html: string,
  params: {
    draftId?: string | null;
    templateId: string;
    urlMap?: Map<string, string>;
  },
) {
  const { draftId, templateId, urlMap } = params;
  const $ = cheerio.load(html);

  const fromPrefixes = draftId
    ? [
        `${PUBLIC_BASE}/assets/tmp/${draftId}/images/`,
        // nếu sau này có thêm biến thể, có thể bổ sung vào đây
      ]
    : [];
  const toPrefix = `${PUBLIC_BASE}/assets/templates/${templateId}/images/`;

  $('img[src]').each((_, el) => {
    const oldSrc = $(el).attr('src') || '';
    if (!oldSrc) return;

    // 1) mapping cụ thể từ urlMap
    if (urlMap && urlMap.has(oldSrc)) {
      $(el).attr('src', urlMap.get(oldSrc)!);
      return;
    }

    // 2) fallback theo prefix tmp → templates (giữ tail filename)
    const matched = fromPrefixes.find((p) => oldSrc.startsWith(p));
    if (matched) {
      const tail = oldSrc.slice(matched.length);
      $(el).attr('src', `${toPrefix}${tail}`);
    }
  });

  // giữ nguyên doctype nếu đã có
  const hasDoctype = /^<!doctype/i.test(html.trim());
  const out = $.root().html() || '';
  return hasDoctype ? out : '<!doctype html>\n' + out;
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

  // Kiểm tra quyền chỉnh sửa (chủ sở hữu hoặc admin)
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

  // Kiểm tra quyền xem template
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

  // Xử lý lỗi Prisma chung
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

  // Chuẩn hoá slug (loại bỏ ký tự lạ, viết thường, không dấu)
  private normalizeSlug(input?: string | null) {
    const s = (input ?? '').trim();
    if (!s) return '';
    return slugify(s, { lower: true, strict: true, locale: 'vi' });
  }

  /**
   * Tạo slug duy nhất trong transaction `tx`.
   * - Nếu `base` trống -> trả về chuỗi rỗng (để caller fallback tiếp)
   * - Nếu `base` đã tồn tại -> thêm -1, -2, ... (nhỏ nhất có thể)
   */
  private async computeUniqueSlug(
    tx: Prisma.TransactionClient,
    base: string,
  ): Promise<string> {
    if (!base) return '';

    // Lấy tất cả slug bắt đầu bằng base
    const existed = await tx.emailTemplate.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const used = new Set(existed.map((x) => x.slug));

    if (!used.has(base)) return base;

    // Tìm số nhỏ nhất chưa dùng
    let i = 1;
    while (used.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }

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
        // ===== 0) Chuẩn hoá + sinh slug duy nhất =====
        // Ưu tiên slug từ dto; nếu trống dùng name; nếu vẫn trống -> dùng ulid()
        const baseSlugRaw =
          dto.slug?.trim() || dto.name?.trim() || ulid().toLowerCase();
        const baseSlug = this.normalizeSlug(baseSlugRaw);
        const uniqueSlug = await this.computeUniqueSlug(tx, baseSlug);

        // ===== 1) Tạo template (tạm lưu html gốc) =====
        // Dùng vòng lặp nhỏ để chống race condition P2002 (hiếm)
        let tmpl: any;
        let attempt = 0;
        let slugToUse = uniqueSlug || ulid().toLowerCase(); // đảm bảo luôn có slug
        // tối đa 10 lần là quá đủ trong thực tế
        while (attempt < 10) {
          try {
            tmpl = await tx.emailTemplate.create({
              data: {
                id: ulid(),
                userId: actor.id,
                statusId: STATUS_ACTIVE,
                name: dto.name,
                slug: slugToUse,
                description: dto.description ?? '',
                html: dto.html, // html gốc (sẽ rewrite ngay sau)
                hasImages: dto.hasImages ?? Boolean(dto.images?.length),
                price: dto.price ?? 0,
                currency: dto.currency ?? 'USD',
                customerId: dto.customerId ?? null,
              },
            });
            break; // thành công -> thoát loop
          } catch (e: any) {
            // Nếu dính unique constraint P2002 trên slug -> tăng hậu tố và thử lại
            if (
              e?.code === 'P2002' &&
              Array.isArray(e?.meta?.target) &&
              e.meta.target.includes('slug')
            ) {
              attempt++;
              // Tăng hậu tố: nếu đã có -n, tăng n; nếu chưa có, bắt đầu từ -1
              const m = slugToUse.match(/^(.*?)-(\d+)$/);
              if (m) {
                const n = parseInt(m[2], 10) + 1;
                slugToUse = `${m[1]}-${n}`;
              } else {
                slugToUse = `${slugToUse}-1`;
              }
              continue;
            }
            throw e; // lỗi khác -> ném ra ngoài
          }
        }

        // ===== 2) Move ảnh từ tmp → templates và lấy urlMap =====
        const images = Array.isArray(dto.images) ? [...dto.images] : [];
        let urlMap = new Map<string, string>();
        if (dto.draftId) {
          // ngay cả khi images rỗng, vẫn cần move folder để fallback rewrite theo prefix
          urlMap = images.length
            ? await moveDraftImagesAndRewriteUrls(dto.draftId, tmpl.id, images)
            : new Map<string, string>();
        }

        // ===== 3) Rewrite HTML bằng Cheerio (ưu tiên urlMap, fallback theo prefix tmp → templates) =====
        let finalHtml = dto.html;
        if (dto.draftId) {
          finalHtml = rewriteHtmlImgSrcWithCheerio(dto.html, {
            draftId: dto.draftId,
            templateId: tmpl.id,
            urlMap,
          });
          await tx.emailTemplate.update({
            where: { id: tmpl.id },
            data: { html: finalHtml },
          });
        }

        // ===== 4) Lưu metadata ảnh =====
        if (images.length) {
          await tx.emailTpImage.createMany({
            data: images.map((img) => ({
              id: ulid(),
              templateId: tmpl.id,
              url: img.url, // đã bị moveDraftImagesAndRewriteUrls mutate sang URL đích
              filename: img.filename ?? (img.url.split('/').pop() || null),
              mimeType: (img as any).mimeType ?? null,
              width: (img as any).width ?? null,
              height: (img as any).height ?? null,
              bytes: (img as any).bytes ?? null,
            })),
            skipDuplicates: true,
          });
        }

        // ===== 5) Finalize thumbnails =====
        if (dto.draftId) {
          const { url200, url600 } = await moveDraftThumbnails(
            dto.draftId,
            tmpl.id,
          );
          if (url200 || url600) {
            await tx.emailTemplate.update({
              where: { id: tmpl.id },
              data: {
                urlThumbnail: url200 ?? null,
                urlThumbnailX600: url600 ?? null,
              },
            });
          }
        }
        tmpl.html = finalHtml;
        return tmpl;
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  // =========================
  // Search / List
  // =========================
  async search(
    actor: { id: string; role?: string },
    query: SearchEmailTemplatesDto,
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 12;
    const skip = (page - 1) * limit;

    const toEndOfDay = (iso?: string) => {
      if (!iso) return undefined;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return undefined;
      d.setHours(23, 59, 59, 999);
      return d;
    };

    // gom single -> many để xử lý chung
    const statusIds =
      (query.statusIds && query.statusIds.length
        ? query.statusIds
        : undefined) ??
      (typeof query.statusId === 'number' && Number.isFinite(query.statusId)
        ? [query.statusId]
        : undefined);

    // 1) điều kiện gốc
    const baseWhere: Prisma.EmailTemplateWhereInput = {
      ...(query.name && { name: { contains: query.name } }),
      ...(query.customerId && { customerId: query.customerId }),
      ...(statusIds && { statusId: { in: statusIds } }), // 🆕 many statuses
    };

    // 2) điều kiện bổ sung
    const and: Prisma.EmailTemplateWhereInput[] = [];

    // tag (đơn)
    if (query.tag) {
      and.push({
        tags: { some: { tag: { name: { contains: query.tag } } } },
      });
    }

    // tags (nhiều) – ANY OF
    if (query.tags?.length) {
      and.push({
        tags: { some: { tag: { name: { in: query.tags } } } },
      });
    }

    // createdAt range
    const createdFrom = query.createdFrom
      ? new Date(query.createdFrom)
      : undefined;
    const createdTo = toEndOfDay(query.createdTo);
    if (createdFrom || createdTo) {
      and.push({
        createdAt: {
          ...(createdFrom && { gte: createdFrom }),
          ...(createdTo && { lte: createdTo }),
        },
      });
    }

    // updatedAt range
    const updatedFrom = query.updatedFrom
      ? new Date(query.updatedFrom)
      : undefined;
    const updatedTo = toEndOfDay(query.updatedTo);
    if (updatedFrom || updatedTo) {
      and.push({
        updatedAt: {
          ...(updatedFrom && { gte: updatedFrom }),
          ...(updatedTo && { lte: updatedTo }),
        },
      });
    }

    // 3) gộp access-control
    const where: Prisma.EmailTemplateWhereInput = this.isAdmin(actor)
      ? and.length
        ? { AND: [baseWhere, ...and] }
        : baseWhere
      : { AND: [baseWhere, ...and, this.accessWhere(actor)] };

    // 4) sort + query
    const sortBy = query.sortBy ?? 'updatedAt';
    const sortDir = query.sortDir ?? 'desc';

    const [total, data] = await this.prisma.$transaction([
      this.prisma.emailTemplate.count({ where }),
      this.prisma.emailTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortDir },
        include: {
          creator: { select: { id: true, email: true } },
          tags: { include: { tag: true } },
          customer: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
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

    // Build data cơ bản
    let data: Prisma.EmailTemplateUpdateInput = { ...dto };

    // Fallback: nếu html còn /assets/tmp/... -> rewrite về templates/:id
    if (dto.html && dto.html.includes('/assets/tmp/')) {
      const $ = cheerio.load(dto.html);
      const toPrefix = `${PUBLIC_BASE}/assets/templates/${id}/images/`;
      $('img[src]').each((_, el) => {
        const src = $(el).attr('src') || '';
        const m = src.match(/\/assets\/tmp\/[^/]+\/images\/(.+)$/);
        if (m) $(el).attr('src', toPrefix + m[1]);
      });
      const hasDoctype = /^<!doctype/i.test(dto.html.trim());
      const out = $.root().html() || '';
      data.html = hasDoctype ? out : '<!doctype html>\n' + out;
    }

    try {
      // 1) Không gửi slug -> cập nhật bình thường
      if (!dto.slug) {
        return await this.prisma.emailTemplate.update({ where: { id }, data });
      }

      // 2) Có gửi slug nhưng không đổi so với hiện tại -> giữ nguyên, không tính lại
      const baseNorm = this.normalizeSlug(dto.slug);
      if (baseNorm === tmpl.slug) {
        return await this.prisma.emailTemplate.update({
          where: { id },
          data: { ...data, slug: tmpl.slug }, // giữ như cũ
        });
      }

      // 3) Có gửi slug & KHÁC hiện tại -> tính slug duy nhất bằng computeUniqueSlug + retry P2002
      return await this.prisma.$transaction(async (tx) => {
        // dùng lại helper cũ
        const unique = await this.computeUniqueSlug(tx, baseNorm);
        let slugToUse = unique || ulid().toLowerCase();

        let attempt = 0;
        while (attempt < 10) {
          try {
            return await tx.emailTemplate.update({
              where: { id },
              data: { ...data, slug: slugToUse },
            });
          } catch (e: any) {
            if (
              e?.code === 'P2002' &&
              Array.isArray(e?.meta?.target) &&
              e.meta.target.includes('slug')
            ) {
              attempt++;
              const m = slugToUse.match(/^(.*?)-(\d+)$/);
              slugToUse = m
                ? `${m[1]}-${parseInt(m[2], 10) + 1}`
                : `${slugToUse}-1`;
              continue;
            }
            throw e;
          }
        }

        // fallback cực hiếm
        return await tx.emailTemplate.update({
          where: { id },
          data: { ...data, slug: `${baseNorm}-${ulid().toLowerCase()}` },
        });
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
