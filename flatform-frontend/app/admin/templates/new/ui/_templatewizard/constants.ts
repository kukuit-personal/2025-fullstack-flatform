import type { TabKey } from "./types";

export const STEP_TITLES = [
  "Editor",
  "Info",
  "Thumbnail",
  "Review & Save",
  "Export",
] as const;

export const TAB_TO_STEP: Record<TabKey, number> = {
  editor: 0,
  info: 1,
  thumbnail: 2,
  reviewsave: 3,
  export: 4,
} as const;
