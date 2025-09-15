'use client';

import { useEffect, useMemo, useState, KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEmailTemplates } from './_page/hooks';

// ====== data cứng ======
const STATUS_OPTIONS = [
  { id: 0, label: 'disabled' },
  { id: 1, label: 'active' },
  { id: 2, label: 'draft' },
  { id: 3, label: 'private' },
  { id: 4, label: 'published' },
  { id: 5, label: 'archived' },
  { id: 6, label: 'progress_to_store' },
  { id: 7, label: 'in_store' },
  { id: 8, label: 'removed_from_store' },
] as const;

const CUSTOMER_OPTIONS = [
  { id: '', label: 'All customers' },
  { id: '1', label: 'MSD' },
  { id: '2', label: 'Merck' },
  { id: '3', label: 'Ferring' },
] as const;

const DEFAULT_PAGE_SIZE = 12;

function parseStatusIds(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
}

function useQueryState() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state = useMemo(() => {
    const toNum = (v: string | null, d: number) => {
      const n = v ? Number(v) : NaN;
      return Number.isFinite(n) && n > 0 ? n : d;
    };
    return {
      page: toNum(sp.get('page'), 1),
      limit: toNum(sp.get('limit'), DEFAULT_PAGE_SIZE),
      name: sp.get('name') ?? '',
      tag: sp.get('tag') ?? '',
      createdFrom: sp.get('createdFrom') ?? '',
      createdTo: sp.get('createdTo') ?? '',
      statusIds: parseStatusIds(sp.get('statusIds')),
      customerId: sp.get('customerId') ?? '',
      sortBy: (sp.get('sortBy') as 'updatedAt' | 'createdAt' | 'name' | 'price') ?? 'updatedAt',
      sortDir: (sp.get('sortDir') as 'asc' | 'desc') ?? 'desc',
    };
  }, [sp]);

  const set = (patch: Partial<typeof state>) => {
    const q = new URLSearchParams(sp.toString());
    const next = { ...state, ...patch };

    const setOrDel = (k: string, v?: string | number | null) => {
      if (v === undefined || v === null || v === '') q.delete(k);
      else q.set(k, String(v));
    };

    setOrDel('page', next.page);
    setOrDel('limit', next.limit);
    setOrDel('name', next.name);
    setOrDel('tag', next.tag);
    setOrDel('createdFrom', next.createdFrom);
    setOrDel('createdTo', next.createdTo);

    if (next.statusIds && next.statusIds.length) q.set('statusIds', next.statusIds.join(','));
    else q.delete('statusIds');

    setOrDel('customerId', next.customerId);
    setOrDel('sortBy', next.sortBy);
    setOrDel('sortDir', next.sortDir);

    router.replace(`${pathname}?${q.toString()}`);
  };

  return [state, set] as const;
}

export default function TemplatesPage() {
  const [q, setQ] = useQueryState();

  // ===== Fetch (TanStack) =====
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

  // ===== Local form state =====
  const [name, setName] = useState(q.name);
  const [tag, setTag] = useState(q.tag);
  const [from, setFrom] = useState(q.createdFrom);
  const [to, setTo] = useState(q.createdTo);

  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<number[]>(q.statusIds);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(q.customerId);
  const [advancedOpen, setAdvancedOpen] = useState(false); // 👈 now used

  useEffect(() => {
    setName(q.name);
    setTag(q.tag);
    setFrom(q.createdFrom);
    setTo(q.createdTo);
    setSelectedStatuses(q.statusIds);
    setSelectedCustomerId(q.customerId);
  }, [q.name, q.tag, q.createdFrom, q.createdTo, q.statusIds, q.customerId]);

  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const startIndex = (q.page - 1) * q.limit + 1;
  const endIndex = Math.min(q.page * q.limit, total);

  const [preview, setPreview] = useState<string | null>(null);

  const onApply = () =>
    setQ({
      page: 1,
      name,
      tag,
      createdFrom: from,
      createdTo: to,
      statusIds: selectedStatuses,
      customerId: selectedCustomerId,
    });

  const onClear = () => {
    setName('');
    setTag('');
    setFrom('');
    setTo('');
    setSelectedStatuses([]);
    setSelectedCustomerId('');
    setQ({
      page: 1,
      name: '',
      tag: '',
      createdFrom: '',
      createdTo: '',
      statusIds: [],
      customerId: '',
    });
  };

  // Enter => Apply
  const onEnterApply = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onApply();
  };

  const statusLabel = useMemo(() => {
    if (!selectedStatuses.length) return 'All status';
    const names = STATUS_OPTIONS.filter((s) => selectedStatuses.includes(s.id)).map((s) => s.label);
    return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  }, [selectedStatuses]);

  const customerLabel =
    CUSTOMER_OPTIONS.find((c) => c.id === selectedCustomerId)?.label ?? 'All customers';

  const toggleStatus = (id: number) => {
    setSelectedStatuses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Summary chips khi thu gọn
  const summaryChips = useMemo(() => {
    const chips: string[] = [];
    if (from || to) chips.push(`${from || '…'} → ${to || '…'}`);
    if (selectedStatuses.length) chips.push(`${selectedStatuses.length} status`);
    if (selectedCustomerId) chips.push(customerLabel);
    return chips;
  }, [from, to, selectedStatuses.length, selectedCustomerId, customerLabel]);

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
          Showing <span className="font-medium">{startIndex || 0}</span>–<span className="font-medium">{endIndex || 0}</span> of{' '}
          <span className="font-medium">{total}</span>
        </div>
      </div>

      {/* Filters (sticky + advanced toggle) */}
      <div className="sticky top-2 z-20">
        <div className="rounded-2xl border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 p-3 md:p-4 shadow-sm">
          {/* Row 1: basic + actions + toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
            {/* Name */}
            <label className="flex flex-col gap-1 xl:col-span-2">
              <span className="text-xs font-medium text-gray-600">Search by name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={onEnterApply}
                placeholder="e.g. Template #12"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              />
            </label>

            {/* Tag */}
            <label className="flex flex-col gap-1 xl:col-span-2">
              <span className="text-xs font-medium text-gray-600">Tag</span>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                onKeyDown={onEnterApply}
                placeholder="e.g. newsletter"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              />
            </label>

            {/* Toggle + chips */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                aria-expanded={advancedOpen}
              >
                {advancedOpen ? 'Hide filters' : 'More filters'}
              </button>

              {/* Chips summary */}
              {!advancedOpen && summaryChips.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {summaryChips.map((c, idx) => (
                    <span
                      key={`${c}-${idx}`}
                      className="text-[11px] px-2 py-1 rounded-full bg-gray-100 ring-1 ring-gray-200"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2 justify-start xl:justify-end">
              <button onClick={onApply} className="px-3 py-2 rounded-xl bg-black text-white text-sm">
                Apply
              </button>
              <button onClick={onClear} className="px-3 py-2 rounded-xl border text-sm">
                Clear
              </button>
            </div>
          </div>

          {/* Row 2: advanced section */}
          {advancedOpen && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {/* Created from */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Created from</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  onKeyDown={onEnterApply}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />
              </label>

              {/* Created to */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Created to</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  onKeyDown={onEnterApply}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />
              </label>

              {/* Status multi-select */}
              <div className="relative">
                <span className="text-xs font-medium text-gray-600">Status</span>
                <button
                  type="button"
                  onClick={() => setStatusOpen((o) => !o)}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-left text-sm hover:bg-gray-50"
                  aria-expanded={statusOpen}
                >
                  {statusLabel}
                </button>
                {statusOpen && (
                  <div className="absolute z-20 mt-2 w-[18rem] rounded-xl border bg-white shadow-lg p-2">
                    <div className="flex items-center justify-between px-2 py-1">
                      <button
                        onClick={() => setSelectedStatuses(STATUS_OPTIONS.map((s) => s.id))}
                        className="text-xs text-gray-600 hover:underline"
                      >
                        Select all
                      </button>
                      <button
                        onClick={() => setSelectedStatuses([])}
                        className="text-xs text-gray-600 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="max-h-56 overflow-auto space-y-1 px-2 py-1">
                      {STATUS_OPTIONS.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(s.id)}
                            onChange={() => toggleStatus(s.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span>{s.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 p-2">
                      <button
                        onClick={() => setStatusOpen(false)}
                        className="px-3 py-1.5 rounded-lg border text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer single-select */}
              <div className="relative">
                <span className="text-xs font-medium text-gray-600">Customer</span>
                <button
                  type="button"
                  onClick={() => setCustomerOpen((o) => !o)}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-left text-sm hover:bg-gray-50"
                  aria-expanded={customerOpen}
                >
                  {customerLabel}
                </button>
                {customerOpen && (
                  <div className="absolute z-20 mt-2 w-64 rounded-xl border bg-white shadow-lg p-2">
                    <div className="max-h-56 overflow-auto space-y-1 px-2 py-1">
                      {CUSTOMER_OPTIONS.map((c) => (
                        <label key={c.id || 'all'} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedCustomerId === c.id}
                            onChange={() =>
                              setSelectedCustomerId((prev) => (prev === c.id ? '' : c.id))
                            }
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span>{c.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 p-2">
                      <button
                        onClick={() => setCustomerOpen(false)}
                        className="px-3 py-1.5 rounded-lg border text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading && <div className="text-sm text-gray-500">Loading templates…</div>}
      {isError && (
        <div className="text-sm text-red-600">
          {(error as Error)?.message || 'Failed to load'}
        </div>
      )}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.items.map((t) => {
            const isAdmin = (t.creatorName ?? '').toLowerCase().includes('admin');
            return (
              <div key={t.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="aspect-video relative bg-gray-50">
                  {t.thumbnailUrl ? (
                    <Image src={t.thumbnailUrl} alt={t.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
                      No thumbnail
                    </div>
                  )}
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium line-clamp-1">{t.name}</div>
                    <div className="text-xs text-gray-500">
                      Updated {t.updatedAt.toLocaleDateString()}
                    </div>

                    <div className="mt-1">
                      <span className="text-xs text-gray-500">Created by</span>{' '}
                      <span
                        className={
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ' +
                          (isAdmin
                            ? 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                            : 'bg-amber-50 text-amber-700 ring-amber-200')
                        }
                      >
                        {t.creatorName ?? '—'}
                      </span>
                    </div>

                    {t.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {t.tags.slice(0, 3).map((tg) => (
                          <span key={tg} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 ring-1 ring-gray-200">
                            {tg}
                          </span>
                        ))}
                        {t.tags.length > 3 && (
                          <span className="text-[10px] text-gray-500">+{t.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {t.price != null && (
                      <div className="text-md text-gray-500">${t.price.toFixed(2)}</div>
                    )}
                    <button
                      onClick={() => t.thumbnailUrl && setPreview(t.thumbnailUrl)}
                      className="px-3 py-1.5 rounded-xl bg-gray-700 text-white text-sm"
                    >
                      View
                    </button>
                    <Link
                      href={`/admin/templates/${t.id}/edit`}
                      className="px-3 py-1.5 rounded-xl bg-black text-white text-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Page <span className="font-medium">{q.page}</span> / {totalPages}
        </div>
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            onClick={() => setQ({ page: Math.max(1, q.page - 1) })}
            disabled={q.page === 1}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const isCurrent = p === q.page;
            return (
              <button
                key={p}
                onClick={() => setQ({ page: p })}
                className={
                  'px-3 py-1.5 rounded-lg text-sm border ' +
                  (isCurrent ? 'bg-black text-white border-black' : 'hover:bg-gray-50')
                }
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setQ({ page: Math.min(totalPages, q.page + 1) })}
            disabled={q.page === totalPages}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </nav>
      </div>

      {/* Image Preview (Popup) */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative bg-white rounded-2xl shadow-lg p-4">
            <div className="w-[80vw] h-[80vh] relative">
              <Image
                src={preview}
                alt="Template Preview"
                fill
                className="object-contain rounded-xl"
              />
            </div>
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 bg-gray-200 rounded-full px-2 py-1 text-sm hover:bg-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
