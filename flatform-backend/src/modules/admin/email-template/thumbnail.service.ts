// src/modules/admin/email-template/thumbnail.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import puppeteer from 'puppeteer';

// ⛔️ Đừng import 'sharp' ở top-level nữa – dùng dynamic import bên dưới

@Injectable()
export class ThumbnailService {
  private storageRoot = path.resolve(process.cwd(), 'storage');

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
  // Load sharp theo kiểu ESM/CJS-agnostic
  private async loadSharp() {
    const mod: any = await import('sharp');
    return mod?.default ?? mod;
  }

  /**
   * Render HTML → tạo /storage/tmp/<draftId>/{thumbnail.jpg, thumbnailx600.jpg}
   * Trả về URL tạm (serve /storage).
   */
  async generatePreviewFromHtml(html: string, draftId: string) {
    const tmpDir = path.join(this.storageRoot, 'tmp', draftId);
    await this.ensureDir(tmpDir);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
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

      const p600 = path.join(tmpDir, 'thumbnailx600.jpg');
      const p200 = path.join(tmpDir, 'thumbnail.jpg');
      await fs.writeFile(p600, jpg600);
      await fs.writeFile(p200, jpg200);

      const baseUrl =
        process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || '';

      return {
        url200: `${baseUrl}/storage/tmp/${draftId}/thumbnail.jpg`,
        url600: `${baseUrl}/storage/tmp/${draftId}/thumbnailx600.jpg`,
        abs200: p200,
        abs600: p600,
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Copy từ /storage/tmp/<draftId>/… → /storage/templates/<templateId>/…
   * Trả về URL final để lưu DB.
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
