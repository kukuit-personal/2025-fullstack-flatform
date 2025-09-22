// useTemplateData.ts
"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FieldValues, UseFormReset } from "react-hook-form"; // ✅ import FieldValues
import { CurrencyEnum } from "../../../constants";
import { getEmailTemplate } from "../../../service";

type UseTemplateDataArgs<TForm extends FieldValues> = {
  // ✅ ràng buộc TForm
  isEdit: boolean;
  templateId?: string | null;
  defaultCurrency: CurrencyEnum;
  reset: UseFormReset<TForm>;
  applyHtmlWithRetry: (html: string, retries?: number) => void;
};

export function useTemplateData<TForm extends FieldValues>({
  // ✅ ràng buộc TForm
  isEdit,
  templateId,
  defaultCurrency,
  reset,
  applyHtmlWithRetry,
}: UseTemplateDataArgs<TForm>) {
  const { data: tmplData } = useQuery({
    queryKey: ["emailTemplate", templateId],
    queryFn: () => getEmailTemplate(templateId as string),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!tmplData) return;
    reset((prev: any) => ({
      ...prev,
      name: tmplData.name ?? "",
      slug: tmplData.slug ?? "",
      description: tmplData.description ?? "",
      price: Number(tmplData.price ?? 0),
      currency: (tmplData.currency as CurrencyEnum) ?? (defaultCurrency as any),
      hasImages: !!tmplData.hasImages,
      customerId: tmplData.customerId ?? null,
      thumbnailUrl: tmplData.urlThumbnail ?? null,
      thumbnailUrl200: tmplData.urlThumbnail ?? null,
      thumbnailUrl600: tmplData.urlThumbnailX600 ?? null,
      thumbnailHtmlSig: null,
    }));
    if (tmplData.html) applyHtmlWithRetry(tmplData.html);
  }, [tmplData, reset, defaultCurrency, applyHtmlWithRetry]);

  return { tmplData };
}
