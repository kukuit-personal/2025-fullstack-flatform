// src/modules/admin/email-template/thumbnail.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import puppeteer from 'puppeteer';

// ⛔️ Sharp: dynamic import bên dưới để tránh lỗi ESM/CJS
type Scope = { kind: 'template'; id: string } | { kind: 'draft'; id: string };

@Injectable()
export class ThumbnailService {
  // Cho phép override qua env, mặc định 'storage'
  private storageRoot = path.resolve(
    process.cwd(),
    process.env.STORAGE_DIR ?? 'storage',
  );

  private async ensureDir(p: string) {
    await fs.mkdir(p, { recursive: true });
  }
  private async pathExists(p: string) {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }
  private async loadSharp() {
    const mod: any = await import('sharp');
    return mod?.default ?? mod;
  }

  /** Tính đường dẫn tuyệt đối + URL public theo scope */
  private resolveBase(scope: Scope) {
    const seg = scope.kind === 'template' ? 'templates' : 'tmp';
    const absDir = path.join(this.storageRoot, seg, scope.id);
    const baseUrl =
      process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || '';
    const pubBase = `${baseUrl}/storage/${seg}/${scope.id}`;
    return { absDir, pubBase };
  }

  /**
   * Render HTML → tạo thumbnail 200/600 theo scope (draft/template).
   * Trả về URL public (serve /storage) + đường dẫn tuyệt đối (nếu cần).
   */
  async generatePreviewFromHtml(args: { html: string; scope: Scope }) {
    const { html, scope } = args;
    if (!html?.trim()) throw new BadRequestException('html is required');

    const { absDir, pubBase } = this.resolveBase(scope);
    await this.ensureDir(absDir);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      // Viewport 600 để chụp khung chuẩn email
      await page.setViewport({ width: 600, height: 800, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pngBuffer = (await page.screenshot({ fullPage: true })) as Buffer;

      const sharp = await this.loadSharp();
      const jpg600 = await sharp(pngBuffer)
        .resize({ width: 600 })
        .jpeg({ quality: 82 })
        .toBuffer();
      const jpg200 = await sharp(pngBuffer)
        .resize({ width: 200 })
        .jpeg({ quality: 82 })
        .toBuffer();

      // Giữ nguyên tên file để FE dễ replace + có cache-buster v=...
      const p600 = path.join(absDir, 'thumbnailx600.jpg');
      const p200 = path.join(absDir, 'thumbnail.jpg');
      await fs.writeFile(p600, jpg600);
      await fs.writeFile(p200, jpg200);

      return {
        url200: `${pubBase}/thumbnail.jpg`,
        url600: `${pubBase}/thumbnailx600.jpg`,
        abs200: p200,
        abs600: p600,
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * (Tùy chọn) Promote ảnh từ draft → template:
   * Copy /storage/tmp/<draftId>/thumbnail*.jpg → /storage/templates/<templateId>/
   */
  async finalizeForTemplateId(draftId: string, templateId: string) {
    const fromDir = path.join(this.storageRoot, 'tmp', draftId);
    const toDir = path.join(this.storageRoot, 'templates', templateId);
    await this.ensureDir(toDir);

    const src200 = path.join(fromDir, 'thumbnail.jpg');
    const src600 = path.join(fromDir, 'thumbnailx600.jpg');
    const dst200 = path.join(toDir, 'thumbnail.jpg');
    const dst600 = path.join(toDir, 'thumbnailx600.jpg');

    if (await this.pathExists(src200)) await fs.copyFile(src200, dst200);
    if (await this.pathExists(src600)) await fs.copyFile(src600, dst600);

    const baseUrl =
      process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || '';

    return {
      final200: `${baseUrl}/storage/templates/${templateId}/thumbnail.jpg`,
      final600: `${baseUrl}/storage/templates/${templateId}/thumbnailx600.jpg`,
    };
  }
}
