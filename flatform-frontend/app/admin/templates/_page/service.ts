import api from '@/lib/api';
import type { SearchParams, SearchResponseDTO } from './types';

export async function searchEmailTemplates(p: SearchParams): Promise<SearchResponseDTO> {
  const params: any = {
    page: p.page ?? 1,
    limit: p.limit ?? 12,
    name: p.name || undefined,
    tag: p.tag || undefined,
    createdFrom: p.createdFrom || undefined,
    createdTo: p.createdTo || undefined,
    updatedFrom: p.updatedFrom || undefined,
    updatedTo: p.updatedTo || undefined,
    sortBy: p.sortBy ?? 'updatedAt',
    sortDir: p.sortDir ?? 'desc',
  };

  // ✅ lọc nhiều trạng thái
  if (p.statusIds?.length) params.statusIds = p.statusIds.join(','); // [0] -> "0"
  // (tương thích ngược) nếu FE đâu đó vẫn truyền statusId đơn lẻ:
  if (!params.statusIds && (p as any).statusId !== undefined) params.statusId = (p as any).statusId;

  // ✅ customer: '' => load all
  if (p.customerId !== undefined) params.customerId = p.customerId;

  const { data } = await api.get('/admin/email/templates', { params });
  return data;
}
