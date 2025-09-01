"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ulid } from "ulid";
import { toast } from "sonner";

import { createEmailTemplate } from "./service";
import { CurrencyEnum } from "./constants";
import { toCreatePayload } from "./adapter";
import { NewTemplateForm, NewTemplateFormValues } from "./types";

import Stepper from "./components/Stepper";
import StepEditor from "./steps/StepEditor";
import StepInfo from "./steps/StepInfo";
import StepThumbnail from "./steps/StepThumbnail";
import StepReviewSave from "./steps/StepReviewSave";
import StepExport from "./steps/StepExport";

export type UploadedImage = {
  url: string;
  filename?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  bytes?: number;
};

const STEP_TITLES = [
  "Editor",
  "Info",
  "Thumbnail",
  "Review & Save",
  "Export",
] as const;

export default function TemplateWizard() {
  const router = useRouter();
  const search = useSearchParams();
  const [step, setStep] = useState<number>(0); // 0..4

  // Editor refs
  const editorRef = useRef<any>(null);
  const uploadedRef = useRef<Map<string, UploadedImage>>(new Map());
  const draftIdRef = useRef<string>(ulid());

  // ===== Form =====
  const defaultCurrency =
    (search.get("currency") as CurrencyEnum) || CurrencyEnum.VND;
  const methods = useForm<NewTemplateFormValues>({
    resolver: zodResolver(NewTemplateForm),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      currency: defaultCurrency,
      hasImages: true,
      customerId: null,
    },
  });
  const { handleSubmit, formState, setValue, getValues } = methods;
  const busy = formState.isSubmitting;

  // ===== Mutation =====
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      toast.success("Đã lưu template");
      //   router.push("/admin/templates");
    },
    onError: (err: any) => {
      console.error("[wizard] save error:", err);
      toast.error(err?.message || "Save failed. Vui lòng thử lại.");
    },
  });

  // ===== Helpers =====
  const getFullHtml = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return "";
    const htmlBody = ed.getHtml({ cleanId: true });
    const css = ed.getCss();
    return `<!doctype html><html><head>
      <meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${getValues("name") || "Template"}</title>
      <style>${css}</style>
    </head><body>${htmlBody}</body></html>`;
  }, [getValues]);

  const extractImageMetas = useCallback(() => {
    const html = getFullHtml();
    if (!html) return [] as UploadedImage[];
    const doc = new DOMParser().parseFromString(html, "text/html");
    const urls = Array.from(doc.querySelectorAll("img"))
      .map((img) => img.getAttribute("src"))
      .filter((u): u is string => !!u);
    const images = urls
      .map((u) => uploadedRef.current.get(u))
      .filter((x): x is UploadedImage => !!x);
    return images;
  }, [getFullHtml]);

  const onSave = useMemo(
    () =>
      handleSubmit(
        async (values) => {
          const html = getFullHtml();
          if (!html || html.trim() === "") {
            setStep(0);
            toast.error(
              "Editor chưa sẵn sàng hoặc chưa có nội dung. Quay lại bước 1 để chỉnh sửa."
            ); // 🆕
            return;
          }
          const images = extractImageMetas();
          const payload = toCreatePayload(
            values,
            html,
            images,
            draftIdRef.current
          );
          await mutateAsync(payload);
        },
        () => {
          setStep(1);
          // Không alert; chỉ 1 toast ngắn gọn
          toast.error("Vui lòng điền đầy đủ các trường bắt buộc ở bước Info.");
          // RHF sẽ focus field lỗi đầu tiên nhờ shouldFocus trong trigger (ở nút Next)
        }
      ),
    [extractImageMetas, getFullHtml, handleSubmit, mutateAsync]
  );

  const setCurrency = (cur: CurrencyEnum) => {
    setValue("currency", cur);
    const params = new URLSearchParams(search.toString());
    params.set("currency", cur);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  const canGoNext = step < STEP_TITLES.length - 1;
  const canGoBack = step > 0;

  // 🆕 Validate Step Info bằng toast (không alert)
  const next = async () => {
    if (!canGoNext) return;
    if (step === 1) {
      const ok = await methods.trigger(["name", "slug", "price", "currency"], {
        shouldFocus: true,
      });
      if (!ok) {
        toast.error("Vui lòng điền đầy đủ các trường bắt buộc ở bước Info.");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const back = () => canGoBack && setStep((s) => s - 1);
  const goTo = (idx: number) => setStep(idx);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <span className="font-medium text-gray-800">Templates</span>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">New</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Create Email Template
        </h1>
        <div className="flex gap-2">
          <button
            onClick={back}
            disabled={!canGoBack}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            type="button"
          >
            Back
          </button>
          {step === 3 ? (
            <button
              onClick={() => setStep(4)}
              disabled={busy || isPending}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-60"
              type="button"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => void next()}
              disabled={!canGoNext}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-60"
              type="button"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <Stepper
        step={step}
        steps={STEP_TITLES as unknown as string[]}
        onStepClick={goTo}
      />

      {/* Steps */}
      <FormProvider {...methods}>
        {/* giữ editor luôn mounted để không mất html */}
        <div className={step === 0 ? "block" : "hidden"}>
          <StepEditor
            editorRef={editorRef}
            uploadedRef={uploadedRef}
            draftIdRef={draftIdRef}
          />
        </div>

        {step === 1 && <StepInfo setCurrency={setCurrency} />}

        {step === 2 && (
          <StepThumbnail
            draftId={draftIdRef.current}
            getFullHtml={getFullHtml}
            apiBase={process.env.NEXT_PUBLIC_API_BASE_URL ?? null}
            onSkip={next}
          />
        )}

        {step === 3 && (
          <StepReviewSave
            getFullHtml={getFullHtml}
            onSave={onSave}
            isSaving={isPending}
          />
        )}

        {step === 4 && <StepExport getFullHtml={getFullHtml} />}
      </FormProvider>
    </div>
  );
}
