"use client";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-gray-500">
        Page <span className="font-medium">{page}</span> / {totalPages}
      </div>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }).map((_, i) => {
          const p = i + 1;
          const isCurrent = p === page;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={
                "px-3 py-1.5 rounded-lg text-sm border " +
                (isCurrent
                  ? "bg-black text-white border-black"
                  : "hover:bg-gray-50")
              }
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50"
        >
          Next
        </button>
      </nav>
    </div>
  );
}
