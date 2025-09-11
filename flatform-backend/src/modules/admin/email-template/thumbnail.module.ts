// src/email-template/thumbnail.module.ts
import { Module } from '@nestjs/common';
import { ThumbnailService } from './thumbnail.service';

@Module({
  providers: [ThumbnailService],
  exports: [ThumbnailService], // QUAN TRỌNG: export để module khác dùng được
})
export class ThumbnailModule {}
