"use client";
import { useEffect, useMemo, useRef, useState, KeyboardEvent } from "react";
import { STATUS_OPTIONS, CUSTOMER_OPTIONS } from "../constants";
import type { QueryState } from "./types-internal";

export function Filters({
  q,
  setQ,
}: {
  q: QueryState;
  setQ: (p: Partial<QueryState>) => void;
}) {
  const [name, setName] = useState(q.name);
  const [tag, setTag] = useState(q.tag);
  const [from, setFrom] = useState(q.createdFrom);
  const [to, setTo] = useState(q.createdTo);
  const [selectedStatuses, setSelectedStatuses] = useState<number[]>(
    q.statusIds
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    q.customerId
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [statusOpen, setStatusOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const customerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setName(q.name);
    setTag(q.tag);
    setFrom(q.createdFrom);
    setTo(q.createdTo);
    setSelectedStatuses(q.statusIds);
    setSelectedCustomerId(q.customerId);
  }, [q]);

  // outside click for dropdowns
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (statusOpen && statusRef.current && !statusRef.current.contains(t))
        setStatusOpen(false);
      if (
        customerOpen &&
        customerRef.current &&
        !customerRef.current.contains(t)
      )
        setCustomerOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [statusOpen, customerOpen]);

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
    setName("");
    setTag("");
    setFrom("");
    setTo("");
    setSelectedStatuses([]);
    setSelectedCustomerId("");
    setQ({
      page: 1,
      name: "",
      tag: "",
      createdFrom: "",
      createdTo: "",
      statusIds: [],
      customerId: "",
    });
  };

  const onEnterApply = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onApply();
  };

  const statusLabel = useMemo(() => {
    if (!selectedStatuses.length) return "All status";
    const names = STATUS_OPTIONS.filter((s) =>
      selectedStatuses.includes(s.id)
    ).map((s) => s.label);
    return names.length <= 2
      ? names.join(", ")
      : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  }, [selectedStatuses]);

  const customerLabel = useMemo(
    () =>
      CUSTOMER_OPTIONS.find((c) => c.id === selectedCustomerId)?.label ??
      "All customers",
    [selectedCustomerId]
  );

  const toggleStatus = (id: number) =>
    setSelectedStatuses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const summaryChips = useMemo(() => {
    const chips: string[] = [];
    if (from || to) chips.push(`${from || "…"} → ${to || "…"}`);
    if (selectedStatuses.length)
      chips.push(`${selectedStatuses.length} status`);
    if (selectedCustomerId) chips.push(customerLabel);
    return chips;
  }, [from, to, selectedStatuses.length, selectedCustomerId, customerLabel]);

  return (
    <div className="top-2 z-20">
      <div className="rounded-2xl border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 p-3 md:p-4 shadow-sm">
        {/* Row 1: basic search + toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onEnterApply}
            placeholder="Search by name..."
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
          />

          {/* Tag */}
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={onEnterApply}
            placeholder="Tag..."
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
          />

          {/* Toggle + chips */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
              aria-expanded={advancedOpen}
            >
              {advancedOpen ? "Hide filters ▲" : "More filters ▼"}
            </button>

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
        </div>

        {/* Row 2: advanced section */}
        {advancedOpen && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* Created from */}
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">
                Created from
              </span>
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
              <span className="text-xs font-medium text-gray-600">
                Created to
              </span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onKeyDown={onEnterApply}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              />
            </label>

            {/* Status multi-select */}
            <div className="relative flex flex-col gap-1" ref={statusRef}>
              <span className="text-xs font-medium text-gray-600">Status</span>
              <button
                type="button"
                onClick={() => setStatusOpen((o) => !o)}
                className="w-full rounded-xl border px-3 py-2 text-left text-sm hover:bg-gray-50"
                aria-expanded={statusOpen}
              >
                {statusLabel}
              </button>
              {statusOpen && (
                <div className="absolute z-20 mt-2 w-[18rem] rounded-xl border bg-white shadow-lg p-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <button
                      onClick={() =>
                        setSelectedStatuses(STATUS_OPTIONS.map((s) => s.id))
                      }
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
                      <label
                        key={s.id}
                        className="flex items-center gap-2 text-sm"
                      >
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
            <div className="relative flex flex-col gap-1" ref={customerRef}>
              <span className="text-xs font-medium text-gray-600">
                Customer
              </span>
              <button
                type="button"
                onClick={() => setCustomerOpen((o) => !o)}
                className="w-full rounded-xl border px-3 py-2 text-left text-sm hover:bg-gray-50"
                aria-expanded={customerOpen}
                aria-haspopup="listbox"
              >
                {customerLabel}
              </button>
              {customerOpen && (
                <div
                  role="listbox"
                  aria-label="Customer"
                  className="absolute z-20 mt-2 w-64 rounded-xl border bg-white shadow-lg p-2"
                >
                  <div className="max-h-56 overflow-auto space-y-1 px-2 py-1">
                    {CUSTOMER_OPTIONS.map((c) => (
                      <label
                        key={c.id || "all"}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="radio"
                          name="customer"
                          checked={selectedCustomerId === c.id}
                          onChange={() => setSelectedCustomerId(c.id)}
                          className="h-4 w-4 border-gray-300"
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

        {/* Actions luôn ở dưới cùng */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onApply}
            className="px-3 py-2 rounded-xl bg-black text-white text-sm"
          >
            Apply
          </button>
          <button
            onClick={onClear}
            className="px-3 py-2 rounded-xl border text-sm"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
