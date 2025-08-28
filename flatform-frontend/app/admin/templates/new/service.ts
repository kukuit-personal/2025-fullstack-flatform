import api from "@/lib/api";
import type { CreateEmailTemplatePayload } from "./types";

export async function createEmailTemplate(payload: CreateEmailTemplatePayload) {
  const { data } = await api.post("/admin/email/templates", payload);
  return data;
}
