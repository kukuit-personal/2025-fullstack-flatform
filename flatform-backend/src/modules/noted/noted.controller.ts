// src/modules/noted/noted.controller.ts
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotedService } from './noted.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SearchNotesDto } from './dto/search-notes.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@ApiTags('Noted')
@ApiBearerAuth()
@Controller('noted')
@UseGuards(JwtAuthGuard)
export class NotedController {
    constructor(private readonly notedService: NotedService) {}

    @Post()
    @ApiOperation({ summary: 'Tạo ghi chú mới' })
    async createNote(@Req() req, @Body() dto: CreateNoteDto) {
        const userId = req.user.userId;
        return this.notedService.createNote(userId, dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Lấy danh sách ghi chú của người dùng' })
    @ApiBearerAuth()
    async getUserNotes(
    @Req() req,
    @Query() query: SearchNotesDto,
    ) {
        const userId = req.user.userId;
        return this.notedService.getUserNotes(userId, query);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Lấy chi tiết 1 ghi chú' })
    @ApiBearerAuth()
    async getNoteDetail(
    @Req() req,

    @Param('id', ParseIntPipe) noteId: number,
    ) {
        const userId = req.user.userId;
        return this.notedService.getNoteDetail(noteId, userId);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Cập nhật ghi chú' })
    @ApiBearerAuth()
    async updateNote(
    @Req() req,
    @Param('id', ParseIntPipe) noteId: number,
    @Body() dto: UpdateNoteDto,
    ) {
        const userId = req.user.userId;
        return this.notedService.updateNote(noteId, userId, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Xóa mềm ghi chú' })
    @ApiBearerAuth()
    async deleteNote(
    @Req() req,
    @Param('id', ParseIntPipe) noteId: number,
    ) {
        const userId = req.user.userId;
        await this.notedService.softDeleteNote(noteId, userId);
    }




}
