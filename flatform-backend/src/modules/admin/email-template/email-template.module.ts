import { Module } from '@nestjs/common';
import { EmailTemplateAdminController } from './email-template.controller';
import { EmailTemplateService } from './email-template.service';
import { EmailTemplateRepository } from './email-template.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { ThumbnailModule } from './thumbnail.module';

@Module({
  imports: [ThumbnailModule],
  controllers: [EmailTemplateAdminController],
  providers: [EmailTemplateService, EmailTemplateRepository, PrismaService],
  exports: [EmailTemplateService],
})
export class EmailTemplateModule {}
