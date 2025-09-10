"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

function hashString(s: string) {
  // djb2-like hash (đủ nhẹ để so HTML đổi)
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

// Thêm cache-buster query param để ép browser tải ảnh mới
function bust(u?: string | null, seed?: number) {
  if (!u) return u || undefined;
  const hasQ = u.includes("?");
  const v = typeof seed === "number" ? seed : Date.now();
  return `${u}${hasQ ? "&" : "?"}v=${v}`;
}

export default function StepThumbnail({
  draftId,
  getFullHtml,
  onSkip,
  apiBase,
}: {
  draftId: string;
  getFullHtml: () => string;
  onSkip: () => void;
  apiBase?: string | null;
}) {
  const { register, setValue, getValues, watch } = useFormContext();

  // Đảm bảo các field được register để watch hoạt động ổn định
  useEffect(() => {
    register("thumbnailUrl");
    register("thumbnailUrl200");
    register("thumbnailUrl600");
    register("thumbnailHtmlSig");
  }, [register]);

  // ===== Persist với RHF =====
  const urlMainForm = watch("thumbnailUrl") as string | undefined | null;
  const url200Form = watch("thumbnailUrl200") as string | undefined | null;
  const url600Form = watch("thumbnailUrl600") as string | undefined | null;

  // Local state chỉ để render tức thời; seed từ form (dùng URL có cache-buster)
  const [urls, setUrls] = useState<{ url200?: string; url600?: string }>(() => {
    const ts = Date.now();
    return {
      url200: url200Form ? bust(url200Form, ts) : urlMainForm ? bust(urlMainForm, ts) : undefined,
      url600: url600Form ? bust(url600Form, ts) : urlMainForm ? bust(urlMainForm, ts) : undefined,
    };
  });
  const [loading, setLoading] = useState(false);

  // Khi mount/đổi form values -> sync state hiển thị (áp dụng cache-buster)
  useEffect(() => {
    const ts = Date.now();
    setUrls({
      url200: url200Form ? bust(url200Form, ts) : urlMainForm ? bust(urlMainForm, ts) : undefined,
      url600: url600Form ? bust(url600Form, ts) : urlMainForm ? bust(urlMainForm, ts) : undefined,
    });
  }, [url200Form, url600Form, urlMainForm]);

  // Nếu HTML đổi so với lần gen trước -> clear thumbnail
  useEffect(() => {
    const currentHtml = getFullHtml() || "";
    const currentSig = hashString(currentHtml);
    const prevSig = getValues("thumbnailHtmlSig") as string | undefined | null;

    if (prevSig && prevSig !== currentSig) {
      // HTML đã đổi -> reset thumbnails
      setValue("thumbnailUrl", null, { shouldDirty: true });
      setValue("thumbnailUrl200", null, { shouldDirty: true });
      setValue("thumbnailUrl600", null, { shouldDirty: true });
      setUrls({ url200: undefined, url600: undefined });
    }
    // Không ghi đè sig ở đây; chỉ cập nhật sau khi Generate thành công
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ check một lần khi vào step

  const onGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${
          apiBase ?? process.env.NEXT_PUBLIC_API_BASE_URL
        }/admin/email/templates/thumbnail/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ html: getFullHtml(), draftId }),
        }
      );
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Generate thumbnails failed");
      }
      const json = await res.json();
      // ✅ GIỮ NGUYÊN ABSOLUTE URL TỪ BE/DB (vd: http://localhost:3001/...)
      const url200Raw = (json.url_thumbnail as string) || undefined;
      const url600Raw = (json.url_thumbnailx600 as string) || undefined;

      // Lưu vào form (KHÔNG bust) để dùng cho Export/Save
      setValue("thumbnailUrl200", url200Raw ?? null, { shouldDirty: true });
      setValue("thumbnailUrl600", url600Raw ?? null, { shouldDirty: true });

      // field chính để StepExport enable (ưu tiên 600)
      const chosen = url600Raw || url200Raw || null;
      setValue("thumbnailUrl", chosen, { shouldDirty: true });

      // UI hiển thị dùng URL có bust để tránh cache
      const ts = Date.now();
      setUrls({
        url200: url200Raw ? bust(url200Raw, ts) : undefined,
        url600: url600Raw ? bust(url600Raw, ts) : undefined,
      });

      // Lưu chữ ký HTML tại thời điểm gen
      const sig = hashString(getFullHtml() || "");
      setValue("thumbnailHtmlSig", sig, { shouldDirty: false });
    } catch (e: any) {
      console.error("[thumbnail] preview error:", e);
      alert(e?.message || "Generate thumbnails failed");
    } finally {
      setLoading(false);
    }
  };

  // ===== UI helpers =====
  const has200 = useMemo(() => !!urls.url200, [urls.url200]);
  const has600 = useMemo(() => !!urls.url600, [urls.url600]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 text-sm text-gray-600">3. Thumbnail</div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 200px */}
        <div className="rounded-lg border border-dashed p-3">
          <div className="mb-2 text-xs font-medium text-gray-500">200px</div>
          <div className="flex items-center justify-center overflow-auto">
            {has200 ? (
              <img
                src={urls.url200}
                alt="thumbnail-200"
                style={{ width: 200, height: "auto" }}
              />
            ) : (
              <span className="text-xs text-gray-400">200px preview</span>
            )}
          </div>
        </div>

        {/* 600px */}
        <div className="rounded-lg border border-dashed p-3">
          <div className="mb-2 text-xs font-medium text-gray-500">600px</div>
          <div className="flex items-center justify-start overflow-auto">
            {has600 ? (
              <img
                src={urls.url600}
                alt="thumbnail-600"
                style={{ width: 600, height: "auto" }}
              />
            ) : (
              <span className="text-xs text-gray-400">600px preview</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={onGenerate}
          type="button"
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
        <button
          onClick={onSkip}
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
