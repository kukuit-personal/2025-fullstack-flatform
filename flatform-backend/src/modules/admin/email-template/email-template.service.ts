import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { SearchEmailTemplatesDto } from './dto/search-email-templates.dto';
import { ulid } from 'ulid';
import { Prisma } from '@prisma/client';

const STATUS_DISABLED = 0;
const STATUS_ACTIVE = 1;

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
  // Create
  // =========================
  async create(actor: Actor, dto: CreateEmailTemplateDto) {
    try {
      return await this.prisma.emailTemplate.create({
        data: {
          id: ulid(),
          ...dto,
          userId: actor.id, // FK tới User
          statusId: STATUS_ACTIVE, // dùng statusId (FK)
        },
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
