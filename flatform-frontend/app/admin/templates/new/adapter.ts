import type {
  CreateEmailTemplatePayload,
  NewTemplateFormValues,
} from "./types";

export function toCreatePayload(
  form: NewTemplateFormValues,
  html: string
): CreateEmailTemplatePayload {
  return {
    name: form.name,
    slug: form.slug,
    description: form.description || "",
    html,
    hasImages: !!form.hasImages,
    price: form.price ?? 0,
    currency: form.currency,
    customerId: form.customerId ?? null,
  };
}
