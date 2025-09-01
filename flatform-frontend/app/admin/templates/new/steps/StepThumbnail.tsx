"use client";

import { useState } from "react";

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
  const [urls, setUrls] = useState<{ url200?: string; url600?: string }>({});
  const [loading, setLoading] = useState(false);

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
      setUrls({
        url200: json.url_thumbnail,
        url600: json.url_thumbnailx600,
      });
    } catch (e: any) {
      console.error("[thumbnail] preview error:", e);
      alert(e?.message || "Generate thumbnails failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 text-sm text-gray-600">3. Thumbnail</div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-40 rounded-lg border border-dashed flex items-center justify-center overflow-hidden">
          {urls.url200 ? (
            <img
              src={urls.url200}
              alt="thumbnail-200"
              className="h-full object-contain"
            />
          ) : (
            <span className="text-xs text-gray-400">200px preview</span>
          )}
        </div>
        <div className="h-40 rounded-lg border border-dashed flex items-center justify-center overflow-hidden">
          {urls.url600 ? (
            <img
              src={urls.url600}
              alt="thumbnail-600"
              className="h-full object-contain"
            />
          ) : (
            <span className="text-xs text-gray-400">600px preview</span>
          )}
        </div>
        <div className="h-40 rounded-lg border border-dashed flex items-center justify-center">
          <span className="text-xs text-gray-400">Reserved</span>
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
