import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class EmailTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(args: Prisma.EmailTemplateCreateArgs) {
    return this.prisma.emailTemplate.create(args);
  }

  findMany(args: Prisma.EmailTemplateFindManyArgs) {
    return this.prisma.emailTemplate.findMany(args);
  }

  count(args: Prisma.EmailTemplateCountArgs) {
    return this.prisma.emailTemplate.count(args);
  }

  findFirst(args: Prisma.EmailTemplateFindFirstArgs) {
    return this.prisma.emailTemplate.findFirst(args);
  }

  update(args: Prisma.EmailTemplateUpdateArgs) {
    return this.prisma.emailTemplate.update(args);
  }

  updateMany(args: Prisma.EmailTemplateUpdateManyArgs) {
    return this.prisma.emailTemplate.updateMany(args);
  }

  // tiện ích cho tags (bảng nối)
  upsertTemplateTags(templateId: string, tagIds: string[]) {
    // Replace all: delete old then createMany
    return this.prisma.$transaction([
      this.prisma.emailTpTemplateTag.deleteMany({ where: { templateId } }),
      ...(tagIds.length
        ? [
            this.prisma.emailTpTemplateTag.createMany({
              data: tagIds.map((tagId) => ({ templateId, tagId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
  }
}
