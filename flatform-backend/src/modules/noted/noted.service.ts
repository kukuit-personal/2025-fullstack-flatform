// src/modules/noted/noted.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { NotedRepository } from './noted.repository';
import { CreateNoteDto } from './dto/create-note.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotedService {
  constructor(
      private readonly notedRepo: NotedRepository, 
      private readonly prisma: PrismaService,
    ) {}

    async createNote(userId: number, dto: CreateNoteDto) {
        return this.notedRepo.createNote({
        title: dto.title,
        content: dto.content ?? '',
        color: dto.color,
        isFavorite: dto.isFavorite ?? false,
        isArchived: dto.isArchived ?? false,
        sortOrder: 0,
        user: { connect: { id: userId } },
        category: dto.categoryId
            ? { connect: { id: dto.categoryId } }
            : undefined,
        parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
        });
    }

    async getUserNotes(userId: number, query: SearchNotesDto) {
        const {
            page = '1',
            limit = '10',
            search,
            categoryId,
            isArchived,
            isFavorite,
            sortBy = 'updatedAt',
            statusId,
        } = query;

        const where: any = {
            userId,
        };

        if (search?.trim()) {
            where.title = {
            contains: search.trim(),
            mode: 'insensitive',
            };
        }

        if (categoryId) where.categoryId = Number(categoryId);
        if (isArchived !== undefined) where.isArchived = isArchived === 'true';
        if (isFavorite !== undefined) where.isFavorite = isFavorite === 'true';

        if (statusId !== undefined) {
            where.statusId = Number(statusId);
        }

        const take = Number(limit);
        const skip = (Number(page) - 1) * take;

        const [data, total] = await this.prisma.$transaction([
            this.prisma.notedNote.findMany({
            where,
            skip,
            take,
            orderBy: {
                [sortBy]: 'desc',
            },
            include: {
                category: true,
                tags: {
                include: {
                    tag: true,
                },
                },
            },
            }),
            this.prisma.notedNote.count({ where }),
        ]);

        return {
            data,
            total,
            page: Number(page),
            limit: take,
            totalPages: Math.ceil(total / take),
        };
    }


    async getNoteDetail(noteId: number, userId: number) {

        const note = await this.prisma.notedNote.findFirst({
            where: {
            id: noteId,
            OR: [
                { userId },
                {
                shares: {
                    some: {
                    sharedWith: userId,
                    },
                },
                },
            ],
            },
            include: {
            category: true,
            tags: {
                include: {
                tag: true,
                },
            },
            shares: {
                include: {
                sharedUser: {
                    select: {
                    id: true,
                    email: true,
                    profile: {
                        select: {
                        name: true,
                        avatar: true,
                        },
                    },
                    },
                },
                },
            },
            },
        });

        if (!note) throw new NotFoundException('Note not found or access denied');
        return note;
    }

    async updateNote(
        noteId: number,
        userId: number,
        dto: UpdateNoteDto,
    ) {
        // Kiểm tra user có phải là chủ sở hữu không
        const note = await this.prisma.notedNote.findFirst({
            where: {
            id: noteId,
            userId,
            },
        });

        if (!note) throw new NotFoundException('Note not found or access denied');

        return this.prisma.notedNote.update({
            where: { id: noteId },
            data: {
            title: dto.title,
            content: dto.content,
            color: dto.color,
            isFavorite: dto.isFavorite,
            isArchived: dto.isArchived,
            category: dto.categoryId
                ? { connect: { id: dto.categoryId } }
                : dto.categoryId === null
                ? { disconnect: true }
                : undefined,
            parent: dto.parentId
                ? { connect: { id: dto.parentId } }
                : dto.parentId === null
                ? { disconnect: true }
                : undefined,
            },
        });
    }

    async softDeleteNote(noteId: number, userId: number) {
        const note = await this.prisma.notedNote.findFirst({
            where: {
            id: noteId,
            OR: [
                { userId },                            // sở hữu
                { shares: { some: { sharedWith: userId} } }       // được chia sẻ
            ]
            }
        });

        if (!note) {
            throw new NotFoundException('Note not found or access denied');
        }

        return this.prisma.notedNote.update({
            where: { id: noteId },
            data: {
                statusId: 0
            },
        });
    }



}
