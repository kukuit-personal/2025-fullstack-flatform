// src/modules/noted/noted.module.ts
import { Module } from '@nestjs/common';
import { NotedService } from './noted.service';
import { NotedController } from './noted.controller';
import { NotedRepository } from './noted.repository';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  controllers: [NotedController],
  providers: [NotedService, NotedRepository, PrismaService],
})
export class NotedModule {}
