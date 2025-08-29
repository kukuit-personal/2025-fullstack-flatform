"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ulid } from "ulid";

import { createEmailTemplate } from "./service";
import { CurrencyEnum, CURRENCY_OPTIONS } from "./constants";
import { toCreatePayload } from "./adapter";
import { NewTemplateForm, NewTemplateFormValues } from "./types";

const loadGrapes = () => import("grapesjs");
const loadNewsletterPreset = () => import("grapesjs-preset-newsletter");

// ====== Kiểu metadata ảnh đã upload ======
type UploadedImage = {
  url: string;
  filename?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  bytes?: number;
};

type UploadProvider = "cloudinary" | "my-storage";

// ====== HTML mặc định cho email 600px ======
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

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const search = useSearchParams();

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  // Lưu metadata ảnh để dùng khi Save
  const uploadedRef = useRef<Map<string, UploadedImage>>(new Map());
  const MAX_BYTES = 5 * 1024 * 1024; // 5MB

  // ⚠️ draftId sinh 1 lần khi vào trang
  const draftIdRef = useRef<string>(ulid());

  // Provider từ env (mặc định cloudinary)
  const uploadProvider: UploadProvider =
    (process.env.NEXT_PUBLIC_UPLOAD_PROVIDER as UploadProvider) || "cloudinary";

  // API base cho my-storage
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL; // ví dụ http://localhost:3001/api

  // ====== Form ======
  const defaultCurrency =
    (search.get("currency") as CurrencyEnum) || CurrencyEnum.VND;

  const form = useForm<NewTemplateFormValues>({
    resolver: zodResolver(NewTemplateForm),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      currency: defaultCurrency as CurrencyEnum,
      hasImages: true,
      customerId: null,
    },
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    getValues,
  } = form;

  // ====== Init GrapesJS ======
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ default: grapesjs }, { default: presetNewsletter }] =
        await Promise.all([loadGrapes(), loadNewsletterPreset()]);
      if (!mounted || !containerRef.current) return;

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const baseFolder =
        process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "email-templates";

      if (uploadProvider === "cloudinary" && (!cloudName || !uploadPreset)) {
        console.warn(
          "Cloudinary env is missing: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
        );
      }

      const editor = grapesjs.init({
        container: containerRef.current,
        height: "calc(100vh - 260px)",
        fromElement: false,
        storageManager: false,
        plugins: [presetNewsletter],
        pluginsOpts: {
          "grapesjs-preset-newsletter": { showStylesOnChange: true },
        },
        // ⬇️ đặt layout mặc định ngay khi init
        components: DEFAULT_HTML,
        assetManager: {
          upload: false, // tự xử lý
          uploadFile: async (e: any) => {
            const files: FileList =
              e?.dataTransfer?.files || e?.target?.files || [];
            for (const file of Array.from(files)) {
              // 1) Giới hạn 5MB
              if (file.size > MAX_BYTES) {
                alert(`"${file.name}" quá 5MB. Vui lòng chọn ảnh nhỏ hơn.`);
                continue;
              }

              if (uploadProvider === "my-storage") {
                // === Upload về backend my-storage (tmp/<draftId>) ===
                if (!apiBase) {
                  alert("Thiếu NEXT_PUBLIC_API_BASE_URL cho my-storage");
                  continue;
                }
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch(
                  `${apiBase}/files/upload?draftId=${draftIdRef.current}`,
                  { method: "POST", body: fd, credentials: "include" }
                );
                if (!res.ok) {
                  const errText = await res.text();
                  throw new Error(`my-storage upload failed: ${errText}`);
                }
                const json = await res.json(); // { url, filename, mimeType, bytes, width?, height? }
                const fileUrl: string = json.url;

                let meta: UploadedImage = {
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

      // (giữ code cũ) Khung email 600px mặc định nếu phát hiện HTML rỗng
      try {
        const hasAnyContent = !!editor.getHtml()?.trim();
        if (!hasAnyContent) {
          editor.setComponents(DEFAULT_HTML);
        }
      } catch (e) {
        console.warn("Skip default wrapper:", e);
      }

      editorRef.current = editor;
    })();

    return () => {
      mounted = false;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [uploadProvider, apiBase]);

  const getFullHtml = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return "";
    const htmlBody = ed.getHtml({ cleanId: true });
    const css = ed.getCss();
    return `<!doctype html><html><head>
            <meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>${getValues("name") || "Template"}</title>
            <style>${css}</style>
            </head><body>${htmlBody}</body></html>`;
  }, [getValues]);

  // ====== Mutation ======
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => router.push("/admin/templates"),
  });

  const onSubmit = async (values: any) => {
    const html = getFullHtml();

    // Lấy danh sách URL ảnh đang dùng trong HTML
    const doc = new DOMParser().parseFromString(html, "text/html");
    const urls = Array.from(doc.querySelectorAll("img"))
      .map((img) => img.getAttribute("src"))
      .filter((u): u is string => !!u);

    // Map sang metadata đã lưu
    const images = urls
      .map((u) => uploadedRef.current.get(u))
      .filter((x): x is UploadedImage => !!x);

    // 🔑 thêm draftId vào payload
    const payload = toCreatePayload(values, html, images, draftIdRef.current);
    await mutateAsync(payload);
  };

  const setCurrency = (cur: CurrencyEnum) => {
    setValue("currency", cur);
    const params = new URLSearchParams(search.toString());
    params.set("currency", cur);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  const busy = isPending || isSubmitting;

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500">
        <span className="font-medium text-gray-800">Templates</span>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">New</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Create Email Template
        </h1>
        <button
          form="template-form"
          type="submit"
          disabled={busy}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Form */}
        <form
          id="template-form"
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1 space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              {...register("name")}
              className="w-full rounded-lg border px-3 py-2"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <input
              {...register("slug")}
              className="w-full rounded-lg border px-3 py-2"
            />
            {errors.slug && (
              <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              {...register("description")}
              className="w-full rounded-lg border px-3 py-2"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Price</label>
              <input
                type="number"
                {...register("price", { valueAsNumber: true })}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Currency</label>
              <select
                {...register("currency")}
                onChange={(e) => setCurrency(e.target.value as CurrencyEnum)}
                className="w-full rounded-lg border px-3 py-2"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="hasImages"
              type="checkbox"
              {...register("hasImages")}
              className="h-4 w-4"
            />
            <label htmlFor="hasImages" className="text-sm">
              Has images
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Customer</label>
            <input
              {...register("customerId", {
                setValueAs: (v) => (v === "" ? null : v),
              })}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </form>

        {/* Editor */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b px-4 py-2 text-sm text-gray-600">Editor</div>
          <div ref={containerRef} className="min-h-[60vh]" />
        </div>
      </div>
    </div>
  );
}
