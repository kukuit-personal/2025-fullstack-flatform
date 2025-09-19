import type {
  EmailTemplateDTO,
  EmailTemplate,
  SearchResult,
  SearchResponseDTO,
} from "./types";

export function adaptOne(dto: EmailTemplateDTO): EmailTemplate {
  const priceNum =
    dto.price != null ? Number(dto.price as unknown as string) : null;

  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug ?? null,
    description: dto.description ?? null,
    thumbnailUrl: dto.urlThumbnail ?? dto.url_thumbnail ?? null,
    thumbnailUrlx600: dto.urlThumbnailX600 ?? dto.url_thumbnailx600 ?? null,
    price: Number.isFinite(priceNum) ? (priceNum as number) : null,
    currency: dto.currency ?? null,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    creatorName: dto.creator?.email ?? null,
    customerName: dto.customer?.name ?? null,
    tags: (dto.tags ?? []).map((t) => t.tag?.name).filter(Boolean) as string[],
  };
}

export function adaptList(resp: SearchResponseDTO): SearchResult {
  return {
    items: (resp.data ?? []).map(adaptOne),
    page: resp.page,
    limit: resp.limit,
    total: resp.total,
    totalPages: resp.totalPages,
  };
}
