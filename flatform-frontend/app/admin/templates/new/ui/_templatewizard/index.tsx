"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ulid } from "ulid";
import { toast } from "sonner";

import { createEmailTemplate, updateEmailTemplate } from "../../service";
import { CurrencyEnum } from "../../constants";
import { toCreatePayload } from "../../adapter";
import { NewTemplateForm, NewTemplateFormValues } from "../../types";

import Stepper from "../../components/Stepper";
import StepEditor from "../../steps/StepEditor";
import StepInfo from "../../steps/StepInfo";
import StepThumbnail from "../../steps/StepThumbnail";
import StepReviewSave from "../../steps/StepReviewSave";
import StepExport from "../../steps/StepExport";

import { STEP_TITLES } from "./constants";
import type { TemplateWizardProps, UploadedImage } from "./types";
import { useEmailTemplateHtml } from "./hooks/useEmailTemplateHtml";
import { useWizardNav } from "./hooks/useWizardNav";
import { useTemplateData } from "./hooks/useTemplateData";

export default function TemplateWizard({
  templateId = null,
  initialTab,
}: TemplateWizardProps) {
  const router = useRouter();
  const search = useSearchParams();
  const isEdit = !!templateId;

  // ===== Editor & uploaded refs =====
  const editorRef = useRef<any>(null);
  const uploadedRef = useRef<Map<string, UploadedImage>>(new Map());
  const draftIdRef = useRef<string>(ulid()); // NEW dùng draftId; EDIT sẽ bỏ qua
  const [editorRefreshKey, setEditorRefreshKey] = useState(0);

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
      thumbnailUrl: null,
      thumbnailUrl200: null,
      thumbnailUrl600: null,
      thumbnailHtmlSig: null,
    },
  });

  const { handleSubmit, formState, setValue } = methods;
  const busy = formState.isSubmitting;

  // ===== HTML helpers (editor) =====
  const {
    getFullHtml,
    getFullHtmlHiddenSync,
    getFullHtmlHiddenInlined,
    extractImageMetas,
    applyServerHtmlToEditor,
    applyHtmlWithRetry,
  } = useEmailTemplateHtml(
    editorRef,
    () => methods.getValues("name"),
    methods.getValues,
    uploadedRef,
    setEditorRefreshKey
  );

  // ===== Navigation / steps =====
  const { step, setStep, canGoNext, canGoBack, next, back, goTo } =
    useWizardNav<NewTemplateFormValues>(initialTab, methods);

  // ===== Edit-mode: fetch DB & hydrate =====
  useTemplateData<NewTemplateFormValues>({
    isEdit,
    templateId,
    defaultCurrency,
    reset: methods.reset,
    applyHtmlWithRetry,
  });

  // ===== Mutations =====
  const { mutateAsync: createAsync, isPending: isCreating } = useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: (res: any) => {
      toast.success("Đã lưu template");
      const finalHtml = res?.html ?? res?.data?.html ?? "";
      if (finalHtml) applyHtmlWithRetry(finalHtml);
      const id = res?.id ?? res?.data?.id;
      if (id) router.replace(`/admin/templates/${id}/edit?reviewsave`);
    },
    onError: (err: any) => {
      console.error("[wizard] save error:", err);
      toast.error(err?.message || "Save failed. Vui lòng thử lại.");
    },
  });

  const { mutateAsync: updateAsync, isPending: isUpdating } = useMutation({
    mutationFn: (payload: any) =>
      updateEmailTemplate(templateId as string, payload),
    onSuccess: (res: any) => {
      toast.success("Đã cập nhật template");
      if (res?.html) applyHtmlWithRetry(res.html);

      // Cập nhật lại thumbnail URLs vào form (không mark dirty)
      const url200 = res?.urlThumbnail ?? null;
      const url600 = res?.urlThumbnailX600 ?? null;
      const main = url600 ?? url200 ?? null;

      methods.setValue("thumbnailUrl200", url200, { shouldDirty: false });
      methods.setValue("thumbnailUrl600", url600, { shouldDirty: false });
      methods.setValue("thumbnailUrl", main, { shouldDirty: false });
    },
  });

  // ===== Handlers =====
  const onCreate = useMemo(
    () =>
      handleSubmit(
        async (values) => {
          const html = await getFullHtmlHiddenInlined();
          if (!html || html.trim() === "") {
            setStep(0);
            toast.error(
              "Editor chưa sẵn sàng hoặc chưa có nội dung. Quay lại bước 1 để chỉnh sửa."
            );
            return;
          }
          const images = extractImageMetas();
          const payload = toCreatePayload(
            values,
            html,
            images,
            draftIdRef.current
          );
          await createAsync(payload);
        },
        () => {
          setStep(1);
          toast.error("Vui lòng điền đầy đủ các trường bắt buộc ở bước Info.");
        }
      ),
    [
      extractImageMetas,
      getFullHtmlHiddenInlined,
      handleSubmit,
      createAsync,
      setStep,
    ]
  );

  const onUpdate = useMemo(
    () =>
      handleSubmit(
        async (values) => {
          const html = await getFullHtmlHiddenInlined();
          if (!html.trim()) {
            setStep(0);
            toast.error("Editor chưa có nội dung.");
            return;
          }
          const payload = toCreatePayload(values, html, [], undefined);
          await updateAsync(payload);
        },
        () => {
          setStep(1);
          toast.error("Vui lòng điền đầy đủ các trường bắt buộc ở bước Info.");
        }
      ),
    [getFullHtmlHiddenInlined, handleSubmit, updateAsync, setStep]
  );

  const setCurrency = (cur: CurrencyEnum) => {
    setValue("currency", cur);
    const params = new URLSearchParams(search.toString());
    params.set("currency", cur);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <span className="font-medium text-gray-800">Templates</span>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">
          {isEdit ? "Edit" : "New"}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {isEdit ? "Edit Email Template" : "Create Email Template"}
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
              disabled={busy || isCreating || isUpdating}
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
        <div className={step === 0 ? "block" : "hidden"}>
          <StepEditor
            editorRef={editorRef}
            uploadedRef={uploadedRef}
            draftIdRef={draftIdRef}
            templateId={templateId ?? undefined}
            isEdit={isEdit}
          />
        </div>

        {step === 1 && <StepInfo setCurrency={setCurrency} />}

        {step === 2 && (
          <StepThumbnail
            draftId={draftIdRef.current}
            templateId={templateId ?? undefined}
            getFullHtml={getFullHtmlHiddenInlined}
            apiBase={process.env.NEXT_PUBLIC_API_BASE_URL ?? null}
            onSkip={next}
          />
        )}

        {step === 3 && (
          <StepReviewSave
            key={editorRefreshKey}
            getFullHtml={getFullHtmlHiddenInlined}
            onSave={isEdit ? onUpdate : onCreate}
            isSaving={isCreating || isUpdating}
            saveLabel={isEdit ? "Update template" : "Create template"}
          />
        )}

        {step === 4 && (
          <StepExport
            key={editorRefreshKey}
            getFullHtml={getFullHtmlHiddenInlined}
            thumbnailUrl={methods.watch("thumbnailUrl") ?? null}
            filenameBase={methods.getValues("slug") || "template"}
          />
        )}
      </FormProvider>
    </div>
  );
}
