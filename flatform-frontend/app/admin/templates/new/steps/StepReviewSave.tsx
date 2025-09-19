"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

export default function StepReviewSave({
  getFullHtml, // ⬅️ async: () => Promise<string>
  onSave,
  isSaving,
  saveLabel = "Create template",
  refreshKey = 0,
}: {
  getFullHtml: () => Promise<string>;
  onSave: () => Promise<void> | void;
  isSaving?: boolean;
  saveLabel?: string;
  refreshKey?: number;
}) {
  const { getValues } = useFormContext();
  const v = getValues();

  // HTML đã inline + ẩn preheader (fetch async từ Wizard)
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const h = await getFullHtml();
        if (mounted) setHtml(h || "");
      } catch (e) {
        console.error("[StepReviewSave] getFullHtml error:", e);
        if (mounted) setHtml("");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getFullHtml, refreshKey]);

  // Tạo preview URL từ HTML
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!html) {
      setPreviewUrl(null);
      return;
    }
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    };
  }, [html]);

  const handleSave = async () => {
    try {
      await Promise.resolve(onSave());
    } catch {
      // nuốt lỗi để không crash UI; toast xử lý ở mutation
    }
  };

  const savingText =
    saveLabel === "Create template" ? "Creating template..." : "Updating...";

  const htmlLength = useMemo(() => (html ? html.length : 0), [html]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 text-sm text-gray-600">4. Review &amp; Save</div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Field label="Name" value={v.name || "—"} />
          <Field label="Slug" value={v.slug || "—"} />
          <Field label="Description" value={v.description || "—"} />
          <Field label="Price" value={String(v.price ?? "—")} />
          <Field label="Currency" value={String(v.currency ?? "—")} />
          <Field label="Customer" value={v.customerId || "—"} />
          <Field label="Has images" value={v.hasImages ? "Yes" : "No"} />

          <div className="pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-60"
            >
              {isSaving ? savingText : saveLabel}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="text-sm font-medium text-gray-700">
                Rendered preview
              </div>
              <div className="text-xs text-gray-500">
                HTML length: {htmlLength} chars
              </div>
            </div>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="h-72 w-full rounded-b-lg"
                title="Email preview"
              />
            ) : (
              <div className="h-72 w-full rounded-b-lg" />
            )}
          </div>

          <div className="rounded-lg border">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="text-sm font-medium text-gray-700">
                HTML source
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(html)}
                disabled={!html}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Copy
              </button>
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words p-3 text-xs text-gray-700">
              {html}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <div className="text-gray-500">{label}</div>
      <div className="font-medium text-gray-900">{value}</div>
    </div>
  );
}
