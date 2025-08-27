import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EmailTemplateRepository } from './email-template.repository';
import { Prisma, EmailTpPermission } from '@prisma/client';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import {
  EmailTemplateSortBy,
  SearchEmailTemplatesDto,
} from './dto/search-email-templates.dto';

const STATUS_DISABLED = 0;
const STATUS_ACTIVE = 1;

@Injectable()
export class EmailTemplateService {
  constructor(private readonly repo: EmailTemplateRepository) {}

  async create(userId: string, dto: CreateEmailTemplateDto) {
    const { tagIds = [], ...rest } = dto;

    const data: Prisma.EmailTemplateCreateInput = {
      name: rest.name,
      slug: rest.slug ?? null,
      description: rest.description ?? null,
      html: rest.html,
      hasImages: rest.hasImages ?? false,
      price: rest.price as any, // Prisma Decimal: number|string đều được
      currency: rest.currency ?? 'USD',
      status: { connect: { id: rest.statusId ?? STATUS_ACTIVE } },
      creator: { connect: { id: userId } },
      customer: rest.customerId
        ? { connect: { id: rest.customerId } }
        : undefined,
    };

    const created = await this.repo.create({
      data,
      include: {
        tags: true,
        status: true,
        creator: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true } },
          },
        },
      },
    });

    if (tagIds.length) {
      await this.repo.upsertTemplateTags(created.id, tagIds);
    }

    return created;
  }

  async search(userId: string, q: SearchEmailTemplatesDto) {
    const page = Number(q.page ?? '1');
    const limit = Math.min(50, Number(q.limit ?? '6'));
    const skip = (page - 1) * limit;

    const statusId = q.statusId ? Number(q.statusId) : STATUS_ACTIVE;
    const tagIds = q.tagIds
      ? q.tagIds
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
      : [];
    const hasImages =
      typeof q.hasImages === 'string'
        ? q.hasImages.toLowerCase() === 'true'
        : undefined;

    const createdFrom = q.createdFrom
      ? new Date(`${q.createdFrom}T00:00:00.000Z`)
      : undefined;
    const createdTo = q.createdTo
      ? new Date(`${q.createdTo}T23:59:59.999Z`)
      : undefined;

    // Quyền xem: owner hoặc shared với user
    const accessWhere: Prisma.EmailTemplateWhereInput = {
      OR: [
        { userId }, // owner
        {
          shares: {
            some: {
              sharedWith: userId,
              permission: {
                in: [
                  EmailTpPermission.VIEW,
                  EmailTpPermission.EDIT,
                  EmailTpPermission.OWNER,
                ],
              },
            },
          },
        },
      ],
    };

    const textWhere = q.q
      ? {
          OR: [
            { name: { contains: q.q, mode: 'insensitive' } },
            { description: { contains: q.q, mode: 'insensitive' } },
          ],
        }
      : {};

    const tagWhere =
      tagIds.length || q.tag
        ? {
            tags: {
              some: {
                OR: [
                  ...(tagIds.length ? [{ tagId: { in: tagIds } }] : []),
                  ...(q.tag
                    ? [
                        {
                          tag: {
                            name: { contains: q.tag, mode: 'insensitive' },
                          },
                        },
                      ]
                    : []),
                ],
              },
            },
          }
        : {};

    const dateWhere =
      createdFrom || createdTo
        ? {
            createdAt: {
              gte: createdFrom,
              lte: createdTo,
            },
          }
        : {};

    const where: Prisma.EmailTemplateWhereInput = {
      AND: [
        accessWhere,
        { statusId },
        textWhere,
        tagWhere,
        dateWhere,
        ...(hasImages !== undefined ? [{ hasImages }] : []),
      ],
    };

    const orderBy: Prisma.EmailTemplateOrderByWithRelationInput =
      q.sortBy === EmailTemplateSortBy.price
        ? { price: 'asc' }
        : q.sortBy === EmailTemplateSortBy.createdAt
          ? { createdAt: 'desc' }
          : { updatedAt: 'desc' }; // default

    const [data, total] = await Promise.all([
      this.repo.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          status: true,
          creator: {
            select: {
              id: true,
              email: true,
              profile: { select: { name: true } },
            },
          },
          tags: { include: { tag: true } },
        },
      }),
      this.repo.count({ where }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async findAccessible(
    templateId: string,
    userId: string,
    needEdit = false,
  ) {
    const entity = await this.repo.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId }, // owner
          {
            shares: {
              some: {
                sharedWith: userId,
                permission: needEdit
                  ? { in: [EmailTpPermission.EDIT, EmailTpPermission.OWNER] }
                  : {
                      in: [
                        EmailTpPermission.VIEW,
                        EmailTpPermission.EDIT,
                        EmailTpPermission.OWNER,
                      ],
                    },
              },
            },
          },
        ],
      },
      include: { status: true, tags: { include: { tag: true } } },
    });

    if (!entity)
      throw new NotFoundException('Email template not found or access denied');
    return entity;
  }

  async findOne(userId: string, templateId: string) {
    return this.findAccessible(templateId, userId, false);
  }

  async update(
    userId: string,
    templateId: string,
    dto: UpdateEmailTemplateDto,
  ) {
    // cần quyền EDIT (hoặc owner)
    await this.findAccessible(templateId, userId, true);

    const { tagIds, ...rest } = dto;

    const updated = await this.repo.update({
      where: { id: templateId },
      data: {
        name: rest.name,
        slug: rest.slug,
        description: rest.description,
        html: rest.html,
        hasImages: rest.hasImages,
        price: (rest.price as any) ?? undefined,
        currency: rest.currency,
        customer: rest.customerId
          ? { connect: { id: rest.customerId } }
          : rest.customerId === null
            ? { disconnect: true }
            : undefined,
        status:
          typeof rest.statusId === 'number'
            ? { connect: { id: rest.statusId } }
            : undefined,
      },
      include: { status: true, tags: { include: { tag: true } } },
    });

    if (tagIds) {
      await this.repo.upsertTemplateTags(templateId, tagIds);
    }

    return updated;
  }

  async softDelete(userId: string, templateId: string) {
    // Chỉ owner được xoá
    const entity = await this.repo.findFirst({
      where: { id: templateId, userId },
    });
    if (!entity)
      throw new NotFoundException('Email template not found or access denied');

    await this.repo.update({
      where: { id: templateId },
      data: { statusId: STATUS_DISABLED },
    });

    return { success: true };
  }
}
