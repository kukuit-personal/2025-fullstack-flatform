// FE models + DTO từ API

export type SortBy = 'updatedAt' | 'createdAt' | 'name' | 'price';
export type SortDir = 'asc' | 'desc';

export type SearchParams = {
  page?: number;
  limit?: number;
  name?: string;
  tag?: string;
  // nếu cần nhiều tag: thêm tags?: string[]
  customerId?: string;         // '' hoặc undefined => load all
  statusIds?: number[];        // 🆕 lọc nhiều trạng thái (ví dụ [1,4,6])
  createdFrom?: string;        // "YYYY-MM-DD" hoặc ISO
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  sortBy?: SortBy;
  sortDir?: SortDir;
};

// === DTO theo response backend (Prisma JSON) ===
export type EmailTemplateDTO = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;

  // Prisma field là camelCase; API khác (thumbnail preview) trả snake_case
  urlThumbnail?: string | null;
  urlThumbnailX600?: string | null;
  url_thumbnail?: string | null;
  url_thumbnailx600?: string | null;

  price?: string | null; // Decimal từ Prisma thường là string
  currency?: string | null;
  createdAt: string;
  updatedAt: string;

  // (tuỳ API include)
  statusId?: number | null;                      // 🆕
  status?: { id: number; status: string } | null; // 🆕

  creator?: { id: string; email: string } | null;
  customer?: { id: string; name: string | null; email: string | null } | null;
  tags?: { id: string; tagId: string; tag: { id: string; name: string } }[];
};

export type SearchResponseDTO = {
  data: EmailTemplateDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// === FE model đã “sạch” cho UI ===
export type EmailTemplate = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  price?: number | null;
  currency?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // 🆕 phản chiếu status (nếu backend include)
  statusId?: number | null;
  statusName?: string | null;

  creatorName?: string | null;
  customerName?: string | null;
  tags: string[];
};

export type SearchResult = {
  items: EmailTemplate[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
