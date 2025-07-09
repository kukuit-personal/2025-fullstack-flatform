import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

import en from '../messages/en.json';
import vi from '../messages/vi.json';

const messagesMap = {
  en,
  vi
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const resolvedLocale = await requestLocale;
  console.log('🌍 Resolved requestLocale:', resolvedLocale);

  const locale = routing.locales.includes(resolvedLocale)
    ? resolvedLocale
    : routing.defaultLocale;

  return {
    locale,
    messages: messagesMap[locale as keyof typeof messagesMap],
  };
});
