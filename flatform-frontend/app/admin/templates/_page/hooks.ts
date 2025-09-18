import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchEmailTemplates } from './service';
import { adaptList } from './adapter';
import type { SearchParams, SearchResult } from './types';

export const EMAIL_TEMPLATES_QK = (p: SearchParams) =>
  ['email-templates', p] as const; // 👈 giúp type queryKey ổn định

export function useEmailTemplates(params: SearchParams) {
  return useQuery<SearchResult>({
    queryKey: EMAIL_TEMPLATES_QK(params),
    queryFn: async () => adaptList(await searchEmailTemplates(params)),
    placeholderData: keepPreviousData,  // 👈 v5: thay cho keepPreviousData: true
    staleTime: 30_000,
  });
}
