"use client";

export function EmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="rounded-2xl border bg-white p-10 text-center">
      <div className="text-lg font-medium">No templates found</div>
      <div className="mt-1 text-sm text-gray-500">
        Try changing filters or reset to defaults.
      </div>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-4 px-3 py-2 rounded-xl border text-sm"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
