"use client";
import Image from "next/image";

export function PreviewModal({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60">
      <div className="relative bg-white rounded-2xl shadow-lg p-4">
        <div className="w-[80vw] h-[80vh] relative">
          <Image
            src={url}
            alt="Template Preview"
            fill
            className="object-contain rounded-xl"
          />
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-gray-200 rounded-full px-2 py-1 text-sm hover:bg-gray-300"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
