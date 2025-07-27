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
  return {
    locale: resolvedLocale ?? routing.defaultLocale,
    messages: messagesMap[(resolvedLocale ?? routing.defaultLocale) as keyof typeof messagesMap],
  };
});
