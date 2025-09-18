"use client";

import { useState } from "react";
import Link from "next/link";
import { useEmailTemplates } from "./_page/hooks";
import { useQueryState } from "./_page/useQueryState";
import { Filters } from "./_page/ui/Filters";
import { TemplateCard } from "./_page/components/TemplateCard";
import { Pagination } from "./_page/ui/Pagination";
import { PreviewModal } from "./_page/ui/PreviewModal";
import { EmptyState } from "./_page/components/EmptyState";
import { SkeletonCard } from "./_page/components/SkeletonCard";

export default function TemplatesPage() {
  const [q, setQ] = useQueryState();

  const { data, isLoading, isError, error } = useEmailTemplates({
    page: q.page,
    limit: q.limit,
    name: q.name || undefined,
    tag: q.tag || undefined,
    createdFrom: q.createdFrom || undefined,
    createdTo: q.createdTo || undefined,
    statusIds: q.statusIds.length ? q.statusIds : undefined,
    customerId: q.customerId || undefined,
    sortBy: q.sortBy,
    sortDir: q.sortDir,
  } as any);

  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const startIndex = (q.page - 1) * q.limit + 1;
  const endIndex = Math.min(q.page * q.limit, total);

  const [preview, setPreview] = useState<string | null>(null);

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">Templates</h1>
          <Link
            href="/admin/templates/new"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black text-white text-sm hover:bg-gray-900"
          >
            + Add
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{startIndex || 0}</span>-
          <span className="font-medium">{endIndex || 0}</span> of{" "}
          <span className="font-medium">{total}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="relative z-20">
        <Filters q={q} setQ={setQ} />
      </div>

      {/* Grid */}
      {isError && (
        <div className="text-sm text-red-600">
          {(error as Error)?.message || "Failed to load"}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: q.limit }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          onReset={() =>
            setQ({
              page: 1,
              name: "",
              tag: "",
              createdFrom: "",
              createdTo: "",
              statusIds: [],
              customerId: "",
            })
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((t: any) => (
            <TemplateCard key={t.id} template={t} onPreview={setPreview} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={q.page}
        totalPages={totalPages}
        onChange={(p) => setQ({ page: p })}
      />

      {/* Preview */}
      <PreviewModal url={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
