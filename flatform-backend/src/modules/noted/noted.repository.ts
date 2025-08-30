// src/modules/noted/noted.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotedRepository {
  constructor(private readonly prisma: PrismaService) {}

  createNote(data: Prisma.NotedNoteCreateArgs['data']) {
    return this.prisma.notedNote.create({ data });
  }
}
