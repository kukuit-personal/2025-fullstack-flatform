"use client";

export default function StepExport({
  getFullHtml,
}: {
  getFullHtml: () => string;
}) {
  const onDownloadHtml = () => {
    const blob = new Blob([getFullHtml()], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Zip generation will be added later
  const onDownloadZip = () => {
    alert("TODO: Export ZIP (html + assets)");
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 text-sm text-gray-600">5. Export</div>
      <p className="text-sm text-gray-700">
        Bạn có thể xuất HTML ngay bây giờ, hoặc sau này mở lại để export ZIP
        (bao gồm HTML + assets).
      </p>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onDownloadHtml}
          type="button"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
        >
          Download HTML
        </button>
        <button
          onClick={onDownloadZip}
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Download ZIP
        </button>
      </div>
    </div>
  );
}
