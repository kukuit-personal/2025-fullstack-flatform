"use client";

import { useCallback } from "react";
import type { RefObject } from "react";
import type { UploadedImage } from "../types";
import { ensureHiddenPreheader } from "../utils/ensureHiddenPreheader";
import { parseFullHtml } from "../utils/parseFullHtml";

/**
 * Gom toàn bộ logic liên quan đến HTML/Editor:
 * - Lấy full HTML từ editor (giữ id/class)
 * - Inline CSS bằng juice rồi ẩn preheader
 * - Trích metadata ảnh đã upload
 * - Đổ HTML từ server vào editor (hydrate)
 * - Retry apply nếu editor chưa sẵn sàng
 */
export function useEmailTemplateHtml(
  editorRef: RefObject<any>,
  getName: () => string,
  getFormValues: <T extends string>(key: T) => any,
  uploadedRef: RefObject<Map<string, UploadedImage>>,
  setEditorRefreshKey: (u: (k: number) => number) => void
) {
  /** Trả về tài liệu HTML đầy đủ (chưa inline), GIỮ id/class để inline chính xác */
  const getFullHtml = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return "";
    const css = ed.getCss();
    const htmlBody = ed.getHtml({ cleanId: false });
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${getFormValues("name") || "Template"}</title>
    ${css ? `<style>${css}</style>` : ""}
  </head>
  ${htmlBody}
</html>`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRef, getFormValues]);

  /** Bản sync: chỉ ẩn preheader (chưa inline). */
  const getFullHtmlHiddenSync = useCallback(
    () => ensureHiddenPreheader(getFullHtml()),
    [getFullHtml]
  );

  /** Bản async: inline toàn bộ CSS rồi mới ẩn preheader. */
  const getFullHtmlHiddenInlined = useCallback(async () => {
    try {
      const { default: juice } = await import("juice");
      const full = getFullHtml();
      const inlined = juice(full);
      return ensureHiddenPreheader(inlined);
    } catch (e) {
      // fallback nếu import juice lỗi
      return getFullHtmlHiddenSync();
    }
  }, [getFullHtml, getFullHtmlHiddenSync]);

  /** Lấy metadata ảnh đã upload (dựa trên Map uploadedRef) */
  const extractImageMetas = useCallback(() => {
    const html = getFullHtml();
    if (!html) return [] as UploadedImage[];
    const doc = new DOMParser().parseFromString(html, "text/html");
    const urls = Array.from(doc.querySelectorAll("img"))
      .map((img) => img.getAttribute("src"))
      .filter((u): u is string => !!u);

    const images = urls
      .map((u) => uploadedRef.current?.get(u))
      .filter((x): x is UploadedImage => !!x);

    return images;
  }, [getFullHtml, uploadedRef]);

  // parse & đổ HTML từ server vào GrapesJS (để export dùng đúng src mới)
  const applyServerHtmlToEditor = useCallback(
    (fullHtml: string) => {
      const ed = editorRef.current;
      if (!ed || !fullHtml) return;
      const { css, body } = parseFullHtml(fullHtml);
      ed.setStyle(css || "");
      ed.setComponents(body || "");
    },
    [editorRef]
  );

  // nếu editor chưa sẵn sàng, retry
  const applyHtmlWithRetry = useCallback(
    (fullHtml: string, retries = 12) => {
      const ed = editorRef.current;
      if (ed) {
        applyServerHtmlToEditor(fullHtml);
        setEditorRefreshKey((k) => k + 1);
        return;
      }
      if (retries > 0) {
        setTimeout(() => applyHtmlWithRetry(fullHtml, retries - 1), 150);
      }
    },
    [editorRef, applyServerHtmlToEditor, setEditorRefreshKey]
  );

  return {
    getFullHtml,
    getFullHtmlHiddenSync,
    getFullHtmlHiddenInlined,
    extractImageMetas,
    applyServerHtmlToEditor,
    applyHtmlWithRetry,
  };
}
