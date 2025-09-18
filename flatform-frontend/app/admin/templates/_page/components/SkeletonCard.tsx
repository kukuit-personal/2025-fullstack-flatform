"use client";

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-1/2 bg-gray-100 rounded" />
        <div className="h-3 w-1/3 bg-gray-100 rounded" />
        <div className="h-3 w-1/4 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
