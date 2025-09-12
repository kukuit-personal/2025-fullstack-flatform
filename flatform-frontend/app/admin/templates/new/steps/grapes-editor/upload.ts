// steps/grapes-editor/upload.ts
import type { UploadProvider } from "./types";

export function makeUploadHandler(
  getEditor: () => any,
  {
    provider,
    apiBaseUrl,
    draftId,
    uploadedMap,
  }: {
    provider: UploadProvider;
    apiBaseUrl?: string | null;
    draftId: string;
    uploadedMap: Map<string, any>;
  }
) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const baseFolder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "email-templates";
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

      if (provider === "my-storage") {
        if (!apiBaseUrl) {
          alert("Thiếu NEXT_PUBLIC_API_BASE_URL cho my-storage");
          continue;
        }
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${apiBaseUrl}/files/upload?draftId=${draftId}`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        if (!res.ok) throw new Error(`my-storage upload failed: ${await res.text()}`);
        const json = await res.json();
        const fileUrl: string = json.url;

        let meta: any = {
          url: fileUrl,
          filename: json.filename ?? file.name,
          mimeType: json.mimeType ?? file.type,
          bytes: json.bytes ?? file.size,
          width: json.width,
          height: json.height,
        };
        if (!meta.width || !meta.height) {
          const img = new Image();
          img.src = fileUrl;
          await img.decode();
          meta.width = img.naturalWidth;
          meta.height = img.naturalHeight;
        }

        editor.AssetManager.add({ src: fileUrl, name: meta.filename || file.name, type: "image" });
        uploadedMap.set(fileUrl, meta);
      } else {
        const form = new FormData();
        form.append("file", file);
        if (uploadPreset) form.append("upload_preset", uploadPreset);
        const folderFinal = baseFolder ? `${baseFolder}/tmp/${draftId}` : `tmp/${draftId}`;
        form.append("folder", folderFinal);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error(`Cloudinary upload failed: ${await res.text()}`);
        const json = await res.json();
        const cdnUrl: string = json.secure_url;

        editor.AssetManager.add({ src: cdnUrl, name: file.name, type: "image" });
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
