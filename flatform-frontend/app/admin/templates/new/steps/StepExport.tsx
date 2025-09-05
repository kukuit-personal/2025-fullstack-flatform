"use client";

import { useMemo } from "react";
import JSZip from "jszip";

type Props = {
  getFullHtml: () => string;
  /** URL ảnh thumbnail (nếu có). Khuyến nghị: lưu ở form field 'thumbnailUrl' rồi truyền xuống đây. */
  thumbnailUrl?: string | null;
  /** Tên file cơ sở cho export */
  filenameBase?: string; // mặc định: "template"
};

export default function StepExport({
  getFullHtml,
  thumbnailUrl,
  filenameBase = "template",
}: Props) {
  // ===== helpers =====
  const parseHtml = (html: string) =>
    new DOMParser().parseFromString(html, "text/html");

  const getImageUrls = (html: string) => {
    const doc = parseHtml(html);
    const urls = Array.from(doc.querySelectorAll("img"))
      .map((img) => img.getAttribute("src"))
      .filter((u): u is string => !!u);
    // Loại trùng
    return Array.from(new Set(urls));
  };

  const filenameFromUrl = (url: string) => {
    try {
      const u = new URL(url);
      const name = u.pathname.split("/").pop() || "image";
      // Bóc query (vd ?v=123), giữ phần tên gốc
      return name.split("?")[0] || "image";
    } catch {
      // không phải absolute URL -> có thể là relative/base64; fallback
      const base = url.split("/").pop() || "image";
      return base.split("?")[0] || "image";
    }
  };

  const blobDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const textDownload = (text: string, mime: string, name: string) => {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    blobDownload(blob, name);
  };

  // Tải một URL ảnh (kể cả dataURL) → Uint8Array + mime
  const fetchImageBinary = async (url: string) => {
    // Data URL?
    if (url.startsWith("data:")) {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      // Lấy mime từ prefix dataURL
      const mime = url.slice(5, url.indexOf(";")) || "application/octet-stream";
      return { data: new Uint8Array(buf), mime };
    }
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Download failed: ${url}`);
    const contentType =
      res.headers.get("content-type") || "application/octet-stream";
    const buf = await res.arrayBuffer();
    return { data: new Uint8Array(buf), mime: contentType };
  };

  // Viết lại HTML để dùng đường dẫn relative /images/<file>
  const rewriteHtmlToLocalImages = async (html: string) => {
    const doc = parseHtml(html);
    const imagesDir = "images";
    const srcMap = new Map<string, string>(); // oldSrc -> newSrc

    const imgEls = Array.from(doc.querySelectorAll("img"));
    for (const img of imgEls) {
      const oldSrc = img.getAttribute("src");
      if (!oldSrc) continue;
      if (!srcMap.has(oldSrc)) {
        // Đặt tên file tránh trùng
        let base = filenameFromUrl(oldSrc);
        if (!/\.[a-z0-9]+$/i.test(base)) base += ".png"; // nếu không có ext
        let candidate = `${imagesDir}/${base}`;
        let i = 1;
        while ([...srcMap.values()].includes(candidate)) {
          const [n, ext = ""] = base.split(/\.(?=[^\.]+$)/);
          candidate = `${imagesDir}/${n}-${i}.${ext || "png"}`;
          i++;
        }
        srcMap.set(oldSrc, candidate);
      }
      img.setAttribute("src", srcMap.get(oldSrc)!);
    }
    const newHtml = "<!doctype html>\n" + doc.documentElement.outerHTML;
    return { newHtml, srcMap };
  };

  // ===== 1) Export HTML (img src online) =====
  const exportHtmlOnline = () => {
    const html = getFullHtml();
    if (!html || !html.trim()) return alert("HTML trống.");
    textDownload(html, "text/html", `${filenameBase}.html`);
  };

  // ===== 2) Export HTML - With thumbnail (zip: html online + thumbnail.jpg) =====
  const exportHtmlOnlineWithThumbnail = async () => {
    const html = getFullHtml();
    if (!html || !html.trim()) return alert("HTML trống.");
    if (!thumbnailUrl)
      return alert("Chưa có thumbnail. Hãy tạo/nhập thumbnail trước.");

    const zip = new JSZip();
    zip.file(`${filenameBase}.html`, html);

    try {
      const { data } = await fetchImageBinary(thumbnailUrl);
      zip.file(`thumbnail.jpg`, data);
    } catch (e) {
      console.error(e);
      return alert("Không tải được thumbnail.");
    }

    const blob = await zip.generateAsync({ type: "blob" });
    blobDownload(blob, `${filenameBase}__html+thumbnail.zip`);
  };

  // ===== 3) Export Zip - Without thumbnail (zip: html + /images) =====
  const exportZipNoThumb = async () => {
    const html = getFullHtml();
    if (!html || !html.trim()) return alert("HTML trống.");

    // Viết lại src -> /images/*
    const { newHtml, srcMap } = await rewriteHtmlToLocalImages(html);
    const zip = new JSZip();
    zip.file(`${filenameBase}.html`, newHtml);

    // Tải toàn bộ ảnh & nhét vào /images
    const addAll = Array.from(srcMap.entries()).map(
      async ([oldSrc, newPath]) => {
        const { data } = await fetchImageBinary(oldSrc);
        zip.file(newPath, data);
      }
    );
    try {
      await Promise.all(addAll);
    } catch (e) {
      console.error(e);
      return alert("Có ảnh không tải được. Kiểm tra lại kết nối/URL.");
    }

    const blob = await zip.generateAsync({ type: "blob" });
    blobDownload(blob, `${filenameBase}__html+images.zip`);
  };

  // ===== 4) Export Zip - With thumbnail (zip: html + /images + thumbnail.jpg) =====
  const exportZipWithThumb = async () => {
    const html = getFullHtml();
    if (!html || !html.trim()) return alert("HTML trống.");
    if (!thumbnailUrl)
      return alert("Chưa có thumbnail. Hãy tạo/nhập thumbnail trước.");

    const { newHtml, srcMap } = await rewriteHtmlToLocalImages(html);
    const zip = new JSZip();
    zip.file(`${filenameBase}.html`, newHtml);

    // ảnh nội dung
    const addImages = Array.from(srcMap.entries()).map(
      async ([oldSrc, newPath]) => {
        const { data } = await fetchImageBinary(oldSrc);
        zip.file(newPath, data);
      }
    );

    // thumbnail
    const addThumb = (async () => {
      const { data } = await fetchImageBinary(thumbnailUrl);
      zip.file("thumbnail.jpg", data);
    })();

    try {
      await Promise.all([...addImages, addThumb]);
    } catch (e) {
      console.error(e);
      return alert("Tải ảnh/thumbnail thất bại.");
    }

    const blob = await zip.generateAsync({ type: "blob" });
    blobDownload(blob, `${filenameBase}__html+images+thumbnail.zip`);
  };

  // ===== UI =====
  const hasThumb = useMemo(() => !!thumbnailUrl, [thumbnailUrl]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 text-sm text-gray-600">5. Export</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* 1 */}
        <button
          onClick={exportHtmlOnline}
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          1. HTML (.html) - <i>Single file</i>
        </button>

        {/* 2 */}
        <button
          onClick={() => void exportHtmlOnlineWithThumbnail()}
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          disabled={!hasThumb}
          title={!hasThumb ? "Chưa có thumbnailUrl" : ""}
        >
          2. ZIP: HTML + thumbnail.jpg - <i>Adds preview image</i>
        </button>

        {/* 3 */}
        <button
          onClick={() => void exportZipNoThumb()}
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          3. ZIP: HTML + /images - <i>Embeds local images</i>
        </button>

        {/* 4 */}
        <button
          onClick={() => void exportZipWithThumb()}
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          disabled={!hasThumb}
          title={!hasThumb ? "Chưa có thumbnailUrl" : ""}
        >
          4. ZIP: HTML + /images + thumbnail.jpg - <i>Full package</i>
        </button>
      </div>
    </div>
  );
}
