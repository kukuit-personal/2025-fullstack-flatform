// src/lib/i18n.ts
export const locales = ['en', 'vi'] as const;
export const defaultLocale = 'vi';

export type Locale = (typeof locales)[number];
