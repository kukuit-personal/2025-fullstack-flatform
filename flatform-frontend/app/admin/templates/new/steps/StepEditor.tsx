"use client";

import { useEffect, useRef, useState } from "react";

type UploadProvider = "cloudinary" | "my-storage";

const loadGrapes = () => import("grapesjs");
const loadNewsletterPreset = () => import("grapesjs-preset-newsletter");

// ===== Shared constants =====
const NBSP = "&nbsp;";
const PREHEADER_BLOCK = `
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

const DEFAULT_HTML = `
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

export default function StepEditor({
  editorRef,
  uploadedRef,
  draftIdRef,
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
  const [preHeader, setPreHeader] = useState("");

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
        height: "calc(100vh - 50px)",
        fromElement: false,
        storageManager: false,
        plugins: [presetNewsletter],
        pluginsOpts: {
          "grapesjs-preset-newsletter": { showStylesOnChange: true },
        },
        components: DEFAULT_HTML,
        assetManager: {
          upload: false,
          uploadFile: async (e: any) => {
            const files: FileList =
              e?.dataTransfer?.files || e?.target?.files || [];
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
                  `${apiBaseUrl}/files/upload?draftId=${draftIdRef.current}`,
                  { method: "POST", body: fd, credentials: "include" }
                );
                if (!res.ok) {
                  const errText = await res.text();
                  throw new Error(`my-storage upload failed: ${errText}`);
                }
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

                editor.AssetManager.add({
                  src: fileUrl,
                  name: meta.filename || file.name,
                  type: "image",
                });
                uploadedRef.current.set(fileUrl, meta);
              } else {
                const form = new FormData();
                form.append("file", file);
                if (uploadPreset) form.append("upload_preset", uploadPreset);
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
                const json = await res.json();
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

      // ===== Helpers: DOM-based (fallback) =====
      const doc = () => editor.Canvas.getDocument() as Document;

      const ensurePreHeader = (): HTMLElement | null => {
        const exist = doc().getElementById("pre-header") as HTMLElement | null;
        if (exist) return exist;
        editor.addComponents(PREHEADER_BLOCK, { at: 0 });
        return doc().getElementById("pre-header") as HTMLElement | null;
      };

      const setPreHeaderText = (text: string) => {
        const p = ensurePreHeader();
        if (!p) return;
        p.textContent = text && text.trim().length > 0 ? text : "\u00A0";
      };

      // ===== Helpers: MODEL-based (chính dùng) =====
      const findComp = (selector: string) =>
        (editor.getWrapper()?.find?.(selector) ?? [])[0] as any | undefined;

      const ensurePreHeaderComp = (): any | undefined => {
        let comp = findComp("#pre-header");
        if (comp) return comp;
        editor.addComponents(PREHEADER_BLOCK, { at: 0 });
        comp = findComp("#pre-header");
        return comp;
      };

      const setPreHeaderTextModel = (text: string) => {
        const comp = ensurePreHeaderComp();
        if (!comp) return;
        const val = text && text.trim().length > 0 ? text : NBSP;
        comp.components(val);
        comp.view?.render?.();
      };

      // === Read text safely (ưu tiên view/DOM, fallback NBSP) ===
      const readPreHeaderText = (): string => {
        try {
          const comp = findComp("#pre-header");
          const inner =
            (comp?.view?.el?.textContent as string | undefined) ?? "";
          const t1 = inner.replace(/\u00A0/g, " ").trim();
          if (t1) return t1;
        } catch {}
        try {
          const p = doc().getElementById("pre-header");
          const t2 = ((p?.textContent as string) || "")
            .replace(/\u00A0/g, " ")
            .trim();
          if (t2) return t2;
        } catch {}
        return "";
      };

      // === Sync input when #pre-header appears/updates/removes ===
      const isPreHeaderComp = (m: any) =>
        (m?.getAttributes?.() || {}).id === "pre-header";

      const syncInputFromEditor = () => {
        const t = readPreHeaderText();
        setPreHeader(t);
      };

      const onCompAddOrUpdate = (m: any) => {
        if (isPreHeaderComp(m)) syncInputFromEditor();
      };
      const onCompRemove = (m: any) => {
        if (isPreHeaderComp(m)) setPreHeader("");
      };

      editor.on("component:add", onCompAddOrUpdate);
      editor.on("component:update", onCompAddOrUpdate);
      editor.on("component:remove", onCompRemove);

      // Initial read on load
      editor.on("load", () => {
        try {
          syncInputFromEditor();
        } catch {}

        // Fallback layout nếu rỗng
        try {
          const comps = editor.getWrapper()?.components();
          const count =
            comps && typeof (comps as any).length === "number"
              ? (comps as any).length
              : 0;
          if (count === 0) editor.setComponents(DEFAULT_HTML);
        } catch {}
      });

      // expose editor
      editorRef.current = editor;
      onReady?.();

      // sync once if state already has value (edit mode)
      if (preHeader) setPreHeaderTextModel(preHeader);
    })();

    return () => {
      mounted = false;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
    // ❗️Đừng đưa `preHeader` vào deps để tránh re-init khi đang gõ
  }, [editorRef, uploadedRef, draftIdRef, uploadProvider, apiBase, onReady]);

  // Input -> update MODEL (giữ logic cũ, có fallback DOM)
  const onChangePreHeader = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value || "";
    setPreHeader(val);

    const ed = editorRef.current;
    if (!ed) return;

    try {
      const comp = (ed.getWrapper()?.find?.("#pre-header") ?? [])[0];
      const safe = val.trim().length > 0 ? val : NBSP;
      if (comp) {
        comp.components(safe);
        comp.view?.render?.();
      } else {
        // nếu chưa có thì tạo rồi set (KHÔNG dùng <div> bọc)
        ed.addComponents(PREHEADER_BLOCK, { at: 0 });
        const created = (ed.getWrapper()?.find?.("#pre-header") ?? [])[0];
        if (created) {
          created.components(safe);
          created.view?.render?.();
        }
      }
    } catch {
      // Fallback DOM-based
      try {
        const d = (editorRef.current as any)?.Canvas.getDocument() as Document;
        let p = d.getElementById("pre-header") as HTMLElement | null;
        if (!p) {
          (editorRef.current as any)?.addComponents(PREHEADER_BLOCK, { at: 0 });
          p = d.getElementById("pre-header") as HTMLElement | null;
        }
        if (p) p.innerHTML = val.trim().length > 0 ? val : NBSP;
      } catch {}
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b px-4 py-2 text-sm text-gray-600">
        <div className="flex flex-col gap-2">
          <div>1. Editor</div>
          {/* Input Pre-header */}
          <label className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Pre-header</span>
            <input
              value={preHeader}
              onChange={onChangePreHeader}
              placeholder="Nhập pre-header (40-140 ký tự)"
              className="flex-1 rounded-md border px-3 py-1.5 text-sm"
              maxLength={180}
            />
            <span className="text-[11px] text-gray-500">
              {preHeader.length}/180
            </span>
          </label>
        </div>
      </div>

      <div ref={containerRef} className="min-h-[60vh]" />
    </div>
  );
}
