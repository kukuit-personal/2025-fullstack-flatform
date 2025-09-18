"use client";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_PAGE_SIZE } from "./constants";
import { parseStatusIds } from "./utils";

export function useQueryState() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state = useMemo(() => {
    const toNum = (v: string | null, d: number) => {
      const n = v ? Number(v) : NaN;
      return Number.isFinite(n) && n > 0 ? n : d;
    };
    return {
      page: toNum(sp.get("page"), 1),
      limit: toNum(sp.get("limit"), DEFAULT_PAGE_SIZE),
      name: sp.get("name") ?? "",
      tag: sp.get("tag") ?? "",
      createdFrom: sp.get("createdFrom") ?? "",
      createdTo: sp.get("createdTo") ?? "",
      statusIds: parseStatusIds(sp.get("statusIds")),
      customerId: sp.get("customerId") ?? "",
      sortBy:
        (sp.get("sortBy") as "updatedAt" | "createdAt" | "name" | "price") ??
        "updatedAt",
      sortDir: (sp.get("sortDir") as "asc" | "desc") ?? "desc",
    };
  }, [sp]);

  const set = (patch: Partial<typeof state>) => {
    const q = new URLSearchParams(sp.toString());
    const next = { ...state, ...patch };

    const setOrDel = (k: string, v?: string | number | null) => {
      if (v === undefined || v === null || v === "") q.delete(k);
      else q.set(k, String(v));
    };

    setOrDel("page", next.page);
    setOrDel("limit", next.limit);
    setOrDel("name", next.name);
    setOrDel("tag", next.tag);
    setOrDel("createdFrom", next.createdFrom);
    setOrDel("createdTo", next.createdTo);

    if (next.statusIds && next.statusIds.length)
      q.set("statusIds", next.statusIds.join(","));
    else q.delete("statusIds");

    setOrDel("customerId", next.customerId);
    setOrDel("sortBy", next.sortBy);
    setOrDel("sortDir", next.sortDir);

    router.replace(`${pathname}?${q.toString()}`);
  };

  return [state, set] as const;
}
