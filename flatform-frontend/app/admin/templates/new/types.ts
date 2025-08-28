// app/admin/templates/new/types.ts
import { z } from "zod";
import { CurrencyEnum } from "./constants";

export const NewTemplateForm = z.object({
  name: z.string().min(3, "Tên tối thiểu 3 ký tự"),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm a-z, 0-9, -"),
  description: z.string().optional(),
  price: z.number().min(0, "Giá >= 0"), // ⬅ đổi sang z.number()
  currency: z.nativeEnum(CurrencyEnum),
  hasImages: z.boolean(),
  customerId: z.string().nullable().optional(),
});
export type NewTemplateFormValues = z.infer<typeof NewTemplateForm>;

export type CreateEmailTemplatePayload = {
  name: string;
  slug: string;
  description: string;
  html: string;
  hasImages: boolean;
  price: number;
  currency: "VND" | "USD";
  customerId: string | null;
};
