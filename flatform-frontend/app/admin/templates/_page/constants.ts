export const STATUS_OPTIONS = [
  { id: 0, label: "disabled" },
  { id: 1, label: "active" },
  { id: 2, label: "draft" },
  { id: 3, label: "private" },
  { id: 4, label: "published" },
  { id: 5, label: "archived" },
  { id: 6, label: "progress_to_store" },
  { id: 7, label: "in_store" },
  { id: 8, label: "removed_from_store" },
] as const;

export const CUSTOMER_OPTIONS = [
  { id: "", label: "All customers" },
  { id: "1", label: "MSD" },
  { id: "2", label: "Merck" },
  { id: "3", label: "Ferring" },
] as const;

export const DEFAULT_PAGE_SIZE = 12;
