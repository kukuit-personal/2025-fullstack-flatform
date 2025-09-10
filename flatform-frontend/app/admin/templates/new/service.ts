import api from "@/lib/api";
import type {
  CreateEmailTemplatePayload,
  UpdateEmailTemplatePayload,
  EmailTemplate,
} from "./types";

/** CREATE */
export async function createEmailTemplate(
  payload: CreateEmailTemplatePayload
): Promise<EmailTemplate> {
  const { data } = await api.post("/admin/email/templates", payload);
  return data;
}

/** GET ONE (dùng cho trang /:id/edit để hydrate form + editor) */
export async function getEmailTemplate(id: string): Promise<EmailTemplate> {
  const { data } = await api.get(`/admin/email/templates/${id}`);
  return data;
}

/** UPDATE (edit-mode: không draftId/images) */
export async function updateEmailTemplate(
  id: string,
  payload: UpdateEmailTemplatePayload
): Promise<EmailTemplate> {
  const { data } = await api.patch(`/admin/email/templates/${id}`, payload);
  return data;
}
