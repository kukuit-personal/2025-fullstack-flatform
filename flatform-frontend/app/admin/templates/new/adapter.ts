import type {
  CreateEmailTemplatePayload,
  NewTemplateFormValues,
  UploadedImage,
} from "./types";

/** Tạo payload gửi API; gộp logic chuẩn hoá và dedupe images */
export function toCreatePayload(
  form: NewTemplateFormValues,
  html: string,
  images?: UploadedImage[],
  draftId?: string
): CreateEmailTemplatePayload {
  const price =
    typeof form.price === "number"
      ? form.price
      : Number.isFinite(Number(form.price))
      ? Number(form.price)
      : 0;

  const payload: CreateEmailTemplatePayload = {
    name: form.name?.trim(),
    slug: form.slug?.trim() || undefined,
    description: (form.description ?? "").trim(),
    html,
    hasImages: !!form.hasImages || !!images?.length,
    price,
    currency: form.currency,
    customerId: form.customerId ?? null,
  };

  if (images?.length) {
    // Deduplicate theo URL để tránh trùng
    const uniq = new Map<string, UploadedImage>();
    for (const img of images) {
      if (img?.url) uniq.set(img.url, img);
    }
    payload.images = Array.from(uniq.values()).map((img) => ({
      url: img.url,
      filename: img.filename,
      mimeType: img.mimeType,
      width: img.width,
      height: img.height,
      bytes: img.bytes,
    }));
  }

  if (draftId) {
    payload.draftId = draftId;
  }

  return payload;
}
