// steps/grapes-editor/upload.ts
import type { UploadProvider } from "./types";

type Ctx = {
  provider: UploadProvider;
  apiBaseUrl?: string | null;
  draftId: string; // luôn có cho chế độ Create
  uploadedMap: Map<string, any>;
  /** optional: truyền trực tiếp templateId nếu có */
  templateId?: string;
  /** optional: storageKey = tpl_<id> | draft_<ulid> (nếu chỉ truyền storageKey cũng OK) */
  storageKey?: string;
};

function resolveTarget({
  draftId,
  templateId,
  storageKey,
}: Pick<Ctx, "draftId" | "templateId" | "storageKey">) {
  // Ưu tiên templateId; nếu không có mà storageKey = tpl_<id> thì suy ra
  const tpl =
    (templateId && templateId.trim()) ||
    (storageKey?.startsWith("tpl_") ? storageKey.slice(4) : "");

  if (tpl) return { kind: "template" as const, id: tpl };
  // nếu storageKey là draft_<...> thì cũng lấy phần sau để tránh lệch id
  const draft =
    (storageKey?.startsWith("draft_") ? storageKey.slice(6) : draftId) || "";
  return { kind: "draft" as const, id: draft };
}

export function makeUploadHandler(getEditor: () => any, ctx: Ctx) {
  const { provider, apiBaseUrl, draftId, uploadedMap, templateId, storageKey } =
    ctx;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const baseFolder =
    process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "email-templates";
  const MAX_BYTES = 5 * 1024 * 1024;

  return async (e: any) => {
    const editor = getEditor();
    if (!editor) {
      console.warn("[upload] Editor not ready yet");
      return;
    }

    const files: FileList = e?.dataTransfer?.files || e?.target?.files || [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        alert(`"${file.name}" quá 5MB. Vui lòng chọn ảnh nhỏ hơn.`);
        continue;
      }

      // ⬇️ Quyết định đích đến
      const target = resolveTarget({ draftId, templateId, storageKey });

      if (provider === "my-storage") {
        if (!apiBaseUrl) {
          alert("Thiếu NEXT_PUBLIC_API_BASE_URL cho my-storage");
          continue;
        }
        const fd = new FormData();
        fd.append("file", file);

        // Gửi đúng query: ?templateId=... | ?draftId=...
        const q =
          target.kind === "template"
            ? `templateId=${encodeURIComponent(target.id)}`
            : `draftId=${encodeURIComponent(target.id)}`;

        const res = await fetch(`${apiBaseUrl}/files/upload?${q}`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        if (!res.ok)
          throw new Error(`my-storage upload failed: ${await res.text()}`);

        const json = await res.json();
        const fileUrl: string = json.url;

        // Meta ảnh (lấy kích thước local để không phải fetch lại)
        const meta: any = {
          url: fileUrl,
          filename: json.filename ?? file.name,
          mimeType: json.mimeType ?? file.type,
          bytes: json.bytes ?? file.size,
          width: json.width,
          height: json.height,
        };
        if (!meta.width || !meta.height) {
          try {
            const bmp = await createImageBitmap(file);
            meta.width = bmp.width;
            meta.height = bmp.height;
            bmp.close();
          } catch {
            // fallback nếu createImageBitmap không khả dụng
            const objUrl = URL.createObjectURL(file);
            const img = new Image();
            img.src = objUrl;
            await img.decode();
            meta.width = img.naturalWidth;
            meta.height = img.naturalHeight;
            URL.revokeObjectURL(objUrl);
          }
        }

        editor.AssetManager.add({
          src: fileUrl,
          name: meta.filename || file.name,
          type: "image",
        });
        uploadedMap.set(fileUrl, meta);
      } else {
        // ===== Cloudinary =====
        const form = new FormData();
        form.append("file", file);
        if (uploadPreset) form.append("upload_preset", uploadPreset);

        // folder theo template/draft
        const folderFinal =
          target.kind === "template"
            ? `${baseFolder}/templates/${target.id}`
            : `${baseFolder}/tmp/${target.id}`;
        form.append("folder", folderFinal);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: form }
        );
        if (!res.ok)
          throw new Error(`Cloudinary upload failed: ${await res.text()}`);
        const json = await res.json();
        const cdnUrl: string = json.secure_url;

        editor.AssetManager.add({
          src: cdnUrl,
          name: file.name,
          type: "image",
        });
        uploadedMap.set(cdnUrl, {
          url: cdnUrl,
          filename: file.name,
          mimeType: file.type,
          bytes: json.bytes ?? file.size,
          width: json.width,
          height: json.height,
        });
      }
    }
  };
}
