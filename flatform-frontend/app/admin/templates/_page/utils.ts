export function parseStatusIds(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
}

export function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString();
}

export function formatPrice(n?: number | null) {
  if (n == null) return "";
  return `$${Number(n).toFixed(2)}`;
}
