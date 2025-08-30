"use client";

import { useEffect, useRef } from "react";

type UploadProvider = "cloudinary" | "my-storage";

const loadGrapes = () => import("grapesjs");
const loadNewsletterPreset = () => import("grapesjs-preset-newsletter");

const DEFAULT_HTML = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fb;">
  <tbody>
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
          <tbody>
            <tr>
              <td style="padding:20px;">
                <!-- Drag & drop newsletter blocks here -->
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
`;

export default function StepEditor({
  editorRef,
  uploadedRef,
  draftIdRef,
  // 🆕 nhận từ wizard (ưu tiên dùng prop, fallback env)
  uploadProvider,
  apiBase,
  onReady,
}: {
  editorRef: React.MutableRefObject<any>;
  uploadedRef: React.MutableRefObject<Map<string, any>>;
  draftIdRef: React.MutableRefObject<string>;
  uploadProvider?: UploadProvider;
  apiBase?: string | null;
  onReady?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ default: grapesjs }, { default: presetNewsletter }] =
        await Promise.all([loadGrapes(), loadNewsletterPreset()]);
      if (!mounted || !containerRef.current) return;

      // ===== Env & options =====
      const MAX_BYTES = 5 * 1024 * 1024; // 5MB
      const provider: UploadProvider =
        uploadProvider ||
        (process.env.NEXT_PUBLIC_UPLOAD_PROVIDER as UploadProvider) ||
        "cloudinary";
      const apiBaseUrl =
        apiBase ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? undefined;

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const baseFolder =
        process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "email-templates";

      if (provider === "cloudinary" && (!cloudName || !uploadPreset)) {
        console.warn(
          "Cloudinary env is missing: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
        );
      }

      const editor = grapesjs.init({
        container: containerRef.current,
        height: "calc(100vh - 320px)",
        fromElement: false,
        storageManager: false,
        plugins: [presetNewsletter],
        pluginsOpts: {
          "grapesjs-preset-newsletter": { showStylesOnChange: true },
        },
        components: DEFAULT_HTML,
        assetManager: {
          upload: false, // custom upload handler
          uploadFile: async (e: any) => {
            const files: FileList =
              e?.dataTransfer?.files || e?.target?.files || [];
            for (const file of Array.from(files)) {
              // 1) Giới hạn 5MB
              if (file.size > MAX_BYTES) {
                alert(`"${file.name}" quá 5MB. Vui lòng chọn ảnh nhỏ hơn.`);
                continue;
              }

              if (provider === "my-storage") {
                // === Upload về backend my-storage (tmp/<draftId>) ===
                if (!apiBaseUrl) {
                  alert("Thiếu NEXT_PUBLIC_API_BASE_URL cho my-storage");
                  continue;
                }
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch(
                  `${apiBaseUrl}/files/upload?draftId=${draftIdRef.current}`,
                  { method: "POST", body: fd, credentials: "include" }
                );
                if (!res.ok) {
                  const errText = await res.text();
                  throw new Error(`my-storage upload failed: ${errText}`);
                }
                const json = await res.json(); // { url, filename, mimeType, bytes, width?, height? }
                const fileUrl: string = json.url;

                let meta: any = {
                  url: fileUrl,
                  filename: json.filename ?? file.name,
                  mimeType: json.mimeType ?? file.type,
                  bytes: json.bytes ?? file.size,
                  width: json.width,
                  height: json.height,
                };
                // nếu backend không đo w/h thì đo ở client
                if (!meta.width || !meta.height) {
                  const img = new Image();
                  img.src = fileUrl;
                  await img.decode();
                  meta.width = img.naturalWidth;
                  meta.height = img.naturalHeight;
                }

                editor.AssetManager.add({
                  src: fileUrl,
                  name: meta.filename || file.name,
                  type: "image",
                });
                uploadedRef.current.set(fileUrl, meta);
              } else {
                // === Cloudinary unsigned ===
                const form = new FormData();
                form.append("file", file);
                if (uploadPreset) form.append("upload_preset", uploadPreset);
                // đưa ảnh theo draftId để dễ quản lý sau này
                const folderFinal = baseFolder
                  ? `${baseFolder}/tmp/${draftIdRef.current}`
                  : `tmp/${draftIdRef.current}`;
                form.append("folder", folderFinal);

                const res = await fetch(
                  `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                  { method: "POST", body: form }
                );
                if (!res.ok) {
                  const errText = await res.text();
                  throw new Error(`Cloudinary upload failed: ${errText}`);
                }
                const json = await res.json(); // { secure_url, bytes, width, height, ... }
                const cdnUrl: string = json.secure_url;

                editor.AssetManager.add({
                  src: cdnUrl,
                  name: file.name,
                  type: "image",
                });

                uploadedRef.current.set(cdnUrl, {
                  url: cdnUrl,
                  filename: file.name,
                  mimeType: file.type,
                  bytes: json.bytes ?? file.size,
                  width: json.width,
                  height: json.height,
                });
              }
            }
          },
        },
      });

      // Fallback đảm bảo có layout mặc định khi editor đã load
      editor.on("load", () => {
        try {
          const comps = editor.getWrapper()?.components();
          const count =
            comps && typeof (comps as any).length === "number"
              ? (comps as any).length
              : 0;
          if (count === 0) editor.setComponents(DEFAULT_HTML);
        } catch (err) {
          console.warn("Default wrapper fallback failed:", err);
        }
      });

      // Khung email 600px mặc định nếu phát hiện HTML rỗng
      try {
        const hasAnyContent = !!editor.getHtml()?.trim();
        if (!hasAnyContent) {
          editor.setComponents(DEFAULT_HTML);
        }
      } catch (e) {
        console.warn("Skip default wrapper:", e);
      }

      editorRef.current = editor;
      onReady?.(); // 🆕 báo wizard biết editor đã sẵn sàng
    })();

    return () => {
      mounted = false;
      // Cleanup chỉ chạy khi rời trang (wizard giữ component luôn mounted khi qua bước khác)
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [editorRef, uploadedRef, draftIdRef, uploadProvider, apiBase, onReady]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b px-4 py-2 text-sm text-gray-600">1. Editor</div>
      <div ref={containerRef} className="min-h-[60vh]" />
    </div>
  );
}
