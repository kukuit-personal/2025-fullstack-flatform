import { z } from "zod";
import { CurrencyEnum } from "./constants";

/** Schema form phía client (không cần images/draftId) */
export const NewTemplateForm = z.object({
  name: z.string().min(3, "Tên tối thiểu 3 ký tự"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug chỉ gồm a-z, 0-9, -"),
  description: z.string().optional(),
  price: z.number().min(0, "Giá >= 0"),
  currency: z.nativeEnum(CurrencyEnum),
  hasImages: z.boolean(),
  customerId: z.string().nullable().optional(),
  thumbnailUrl: z.string().url("Thumbnail must be a valid URL").optional().nullable(),
});
export type NewTemplateFormValues = z.infer<typeof NewTemplateForm>;

/** Metadata ảnh (khớp DTO backend) */
export type UploadedImage = {
  url: string;
  filename?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  bytes?: number; // FE + BE đều chặn <= 5MB
};

/** Kiểu dữ liệu template trả về từ API (tối thiểu các field FE cần) */
export type EmailTemplate = {
  id: string;
  userId?: string;
  name: string;
  slug: string;
  description?: string | null;
  html: string;
  hasImages?: boolean;
  price?: number;
  currency?: CurrencyEnum | string;
  customerId?: string | null;
  statusId?: number;
  urlThumbnail?: string | null;
  urlThumbnailX600?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // ...nếu BE trả thêm, bạn có thể mở rộng dần
};

/** Payload gửi lên API tạo template */
export type CreateEmailTemplatePayload = {
  name: string;
  slug?: string; // backend cho phép optional
  description?: string;
  html: string;
  hasImages: boolean;
  price: number;
  currency: CurrencyEnum;
  customerId: string | null;
  images?: UploadedImage[]; // danh sách ảnh gửi kèm (nếu có)
  draftId?: string; // để backend move từ tmp → templates (nếu dùng my-storage)
};

/**
 * Payload UPDATE (edit-mode):
 * - Không dùng draftId / images
 * - Mọi field đều optional để partial update
 */
export type UpdateEmailTemplatePayload = Partial<{
  name: string;
  slug: string;
  description: string | null;
  html: string;
  hasImages: boolean;
  price: number;
  currency: CurrencyEnum | string;
  customerId: string | null;
  statusId: number;
  tagIds: string[];
  // thumbnail Url nếu bạn cho phép update trực tiếp:
  urlThumbnail: string | null;
  urlThumbnailX600: string | null;
}>;
