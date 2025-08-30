"use client";

export default function StepThumbnail({
  onGenerate,
  onSkip,
}: {
  onGenerate: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 text-sm text-gray-600">3. Thumbnail</div>
      <div className="mb-4 text-gray-700">
        <p className="text-sm">
          (UI trước – sau sẽ code gen thumbnail từ HTML. Có thể tạo nhiều
          thumbnail hoặc chọn 1.)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-40 rounded-lg border border-dashed" />
        <div className="h-40 rounded-lg border border-dashed" />
        <div className="h-40 rounded-lg border border-dashed" />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={onGenerate}
          type="button"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
        >
          Generate
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
