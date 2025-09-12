// steps/grapes-editor.config.ts
// KHÔNG cần "use client" ở file này, chỉ gọi từ component client.
// Gói toàn bộ logic init + config + blocks + categories + upload tại đây.

export type UploadProvider = "cloudinary" | "my-storage";

export const NBSP = "&nbsp;";
export const PREHEADER_BLOCK = `
<table role="presentation" width="650" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0">
  <tbody>
    <tr>
      <td width="650" align="center" bgcolor="#ffffff" style="display:none;visibility:hidden;opacity:0;color:transparent;max-height:0;max-width:0;overflow:hidden;mso-hide:all;">
        <p id="pre-header"
           style="margin:0;font-size:1px;line-height:1px;color:transparent;display:none;visibility:hidden;opacity:0;max-height:0;max-width:0;overflow:hidden;mso-hide:all;"
           aria-hidden="true">${NBSP}</p>
      </td>
    </tr>
  </tbody>
</table>
`;

export const DEFAULT_HTML = `
  <!-- Pre-header (hidden) -->
  ${PREHEADER_BLOCK}
  <!-- End Pre-header -->

  <!-- Main -->
  <table role="presentation" width="650" align="center" bgcolor="#f4f4f4" border="0" cellpadding="0" cellspacing="0" style="min-height:500px;">
    <tbody>
      <tr>
        <td valign="top">
          <!-- Drag & drop newsletter blocks here -->
        </td>
      </tr>
    </tbody>
  </table>
`;

// ===== Custom Blocks (HTML chỉ gồm table, p, img, a) =====
export const BLOCK_ONE_SECTION = `
<table role="presentation" width="650" align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0;background:#ffffff;">
  <tbody>
    <tr>
      <td valign="top" style="padding:16px;">
        <p style="margin:0 0 8px 0;line-height:1.4;color:#111111;font-size:14px;">
          Lorem ipsum dolor sit amet, <a href="#a" style="text-decoration:underline;">a link</a>.
        </p>
        <p style="margin:0;line-height:1.4;color:#555555;font-size:13px;">
          Replace this text with your content. You can also insert an <a href="#a" style="text-decoration:underline;">anchor link</a>.
        </p>
      </td>
    </tr>
  </tbody>
</table>
`;

export const BLOCK_HALF_SECTION = `
<table role="presentation" width="650" align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0;background:#ffffff;">
  <tbody>
    <tr>
      <!-- Col 1 -->
      <td width="325" valign="top" style="padding:16px;">
        <p style="margin:0 0 8px 0;line-height:1.4;color:#111111;font-size:14px;">
          Left column paragraph with an <a href="#a" style="text-decoration:underline;">anchor link</a>.
        </p>
        <p style="margin:0;line-height:1.4;color:#555555;font-size:13px;">
          Add your text here. You can also place an image below:
        </p>
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0;margin-top:8px;">
          <tbody>
            <tr>
              <td align="left">
                <img src="https://via.placeholder.com/300x150" width="300" height="150" alt="Placeholder"
                     style="display:block;border:0;outline:none;text-decoration:none;max-width:100%;height:auto;" />
              </td>
            </tr>
          </tbody>
        </table>
      </td>

      <!-- Col 2 -->
      <td width="325" valign="top" style="padding:16px;">
        <p style="margin:0 0 8px 0;line-height:1.4;color:#111111;font-size:14px;">
          Right column paragraph. <a href="#a" style="text-decoration:underline;">Learn more</a>.
        </p>
        <p style="margin:0;line-height:1.4;color:#555555;font-size:13px;">
          Put any text here. All markup sticks to table, p, img, a.
        </p>
      </td>
    </tr>
  </tbody>
</table>
`;

export type InitEditorOptions = {
  container: HTMLElement;
  // refs/holders để dùng trong upload
  draftId: string;
  uploadedMap: Map<string, any>;
  uploadProvider?: UploadProvider;
  apiBaseUrl?: string | null;
  // tuỳ chọn height
  height?: string;
  // bật tắt block mặc định của preset (mặc định: GIỮ để đưa vào category Layout)
  keepPresetBlocks?: boolean;
  // cấu hình categories
  categories?: {
    emailLayoutLabel?: string;
    layoutLabel?: string;
    emailLayoutOpen?: boolean;
    layoutOpen?: boolean;
  };
};

// Hàm khởi tạo editor + upload + categories + blocks
export async function initEmailGrapesEditor({
  container,
  draftId,
  uploadedMap,
  uploadProvider,
  apiBaseUrl,
  height = "calc(100vh - 50px)",
  keepPresetBlocks = true,
  categories = {
    emailLayoutLabel: "Email layout",
    layoutLabel: "Layout",
    emailLayoutOpen: true,
    layoutOpen: false,
  },
}: InitEditorOptions) {
  const [{ default: grapesjs }, { default: presetNewsletter }] = await Promise.all([
    import("grapesjs"),
    import("grapesjs-preset-newsletter"),
  ]);

  const provider: UploadProvider =
    uploadProvider ||
    (process.env.NEXT_PUBLIC_UPLOAD_PROVIDER as UploadProvider) ||
    "cloudinary";

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const baseFolder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "email-templates";

  if (provider === "cloudinary" && (!cloudName || !uploadPreset)) {
    console.warn(
      "Cloudinary env is missing: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
    );
  }

  const editor = grapesjs.init({
    container,
    height,
    fromElement: false,
    storageManager: false,
    plugins: [presetNewsletter],
    pluginsOpts: {
      "grapesjs-preset-newsletter": {
        // GIỮ block mặc định để đẩy qua category "Layout"
        ...(keepPresetBlocks ? {} : { blocks: [] }),
        showStylesOnChange: true,
      },
    },
    components: DEFAULT_HTML,
    assetManager: {
      upload: false,
      uploadFile: async (e: any) => {
        const MAX_BYTES = 5 * 1024 * 1024;
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
            const res = await fetch(
              `${apiBaseUrl}/files/upload?draftId=${draftId}`,
              { method: "POST", body: fd, credentials: "include" }
            );
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
      },
    },
  });

  // ===== Categories
  const bm = editor.BlockManager;
  bm.getCategories().reset([
    { id: "email-layout", label: categories.emailLayoutLabel || "Email layout", open: !!categories.emailLayoutOpen, order: 1 },
    { id: "layout", label: categories.layoutLabel || "Layout", open: !!categories.layoutOpen, order: 2 },
  ]);

  // Đưa tất cả block mặc định (nếu có) vào "Layout"
  bm.getAll().forEach((b: any) => b.set("category", { id: "layout", label: categories.layoutLabel || "Layout" }));

  // Thêm block custom vào "Email layout"
  bm.add("one-section", {
    label: "1 Section",
    category: { id: "email-layout", label: categories.emailLayoutLabel || "Email layout" },
    attributes: { title: "1 Section" },
    content: BLOCK_ONE_SECTION,
  });

  bm.add("half-section", {
    label: "1/2 Section",
    category: { id: "email-layout", label: categories.emailLayoutLabel || "Email layout" },
    attributes: { title: "1/2 Section" },
    content: BLOCK_HALF_SECTION,
  });

  return editor;
}
