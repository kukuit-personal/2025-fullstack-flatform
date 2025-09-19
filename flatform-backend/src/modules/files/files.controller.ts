import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
function sanitizeName(name: string) {
  return name.normalize('NFKD').replace(/[^\w.-]+/g, '_');
}

@Controller('files')
export class FilesController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_BYTES },
      storage: diskStorage({
        destination: (req: any, _file, cb) => {
          const q = req.query ?? {};
          const templateId = String(q.templateId ?? '').trim();
          const draftId = String(q.draftId ?? '').trim();

          // Ưu tiên templateId > draftId
          const seg = templateId ? 'templates' : draftId ? 'tmp' : null;
          const id = templateId || draftId;

          if (!seg || !id) {
            return cb(
              new BadRequestException('Provide templateId or draftId') as any,
              '',
            );
          }

          const STORAGE_DIR = process.env.STORAGE_DIR || 'storage';
          const dest = join(process.cwd(), STORAGE_DIR, seg, id, 'images');
          ensureDir(dest);
          cb(null, dest);
        },
        filename: (_req, file, cb) => {
          const base = `${Date.now()}-${sanitizeName(
            file.originalname || 'file',
          )}`;
          cb(null, base);
        },
      }),
    }),
  )
  upload(
    @UploadedFile() file?: Express.Multer.File,
    @Query('templateId') templateId?: string,
    @Query('draftId') draftId?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    // Ưu tiên templateId > draftId
    const seg = templateId?.trim()
      ? 'templates'
      : draftId?.trim()
        ? 'tmp'
        : null;
    const id = (templateId || draftId || '').trim();
    if (!seg || !id) {
      throw new BadRequestException('Provide templateId or draftId');
    }

    // Lưu ý: cần map STATIC: STORAGE_DIR -> /assets ở main.ts (serve-static)
    const base = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';
    const url = `${base}/assets/${seg}/${id}/images/${file.filename}`;

    return {
      url,
      filename: file.originalname,
      mimeType: file.mimetype,
      bytes: file.size,
    };
  }
}
