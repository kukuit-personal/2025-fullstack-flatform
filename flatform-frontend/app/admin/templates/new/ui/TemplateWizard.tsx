"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ulid } from "ulid";
import { toast } from "sonner";

import {
  createEmailTemplate,
  getEmailTemplate,
  updateEmailTemplate,
} from "../service";
import { CurrencyEnum } from "../constants";
import { toCreatePayload } from "../adapter";
import { NewTemplateForm, NewTemplateFormValues } from "../types";

import Stepper from "../components/Stepper";
import StepEditor from "../steps/StepEditor";
import StepInfo from "../steps/StepInfo";
import StepThumbnail from "../steps/StepThumbnail";
import StepReviewSave from "../steps/StepReviewSave";
import StepExport from "../steps/StepExport";

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

const TAB_TO_STEP = {
  editor: 0,
  info: 1,
  thumbnail: 2,
  reviewsave: 3,
  export: 4,
} as const;
type TabKey = keyof typeof TAB_TO_STEP;

/** Ẩn chắc chắn p#pre-header (idempotent) */
function ensureHiddenPreheader(html: string): string {
  try {
    const hasHtmlTag = /<\s*html[\s>]/i.test(html);
    const shell = hasHtmlTag
      ? html
      : `<!doctype html><html><body>${html}</body></html>`;
    const doc = new DOMParser().parseFromString(shell, "text/html");
    const p = doc.getElementById("pre-header") as HTMLElement | null;
    if (p) {
      const H =
        "display:none !important;visibility:hidden !important;opacity:0 !important;color:transparent !important;max-height:0 !important;max-width:0 !important;overflow:hidden !important;mso-hide:all !important;font-size:1px !important;line-height:1px !important;";
      p.setAttribute("style", `${p.getAttribute("style") || ""};${H}`);
      p.setAttribute("aria-hidden", "true");
      const td = p.closest("td") as HTMLElement | null;
      if (td)
        td.setAttribute(
          "style",
          `${td.getAttribute("style") || ""};mso-hide:all !important;`
        );
    }
    return hasHtmlTag ? doc.documentElement.outerHTML : doc.body.innerHTML;
  } catch {
    return html;
  }
}

export default function TemplateWizard({
  templateId = null, // có templateId => edit mode
  initialTab, // (editor | info | thumbnail | reviewsave | export)
}: {
  templateId?: string | null;
  initialTab?: TabKey;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const isEdit = !!templateId;

  // đọc tab từ URL (?reviewsave | ?export | ?tab=reviewsave)
  const initialStepFromUrl = useMemo(() => {
    const tabParam = search.get("tab");
    const knownTab =
      (tabParam && TAB_TO_STEP[tabParam as TabKey]) ||
      (search.has("reviewsave") ? TAB_TO_STEP.reviewsave : undefined) ||
      (search.has("export") ? TAB_TO_STEP.export : undefined);
    return typeof knownTab === "number" ? knownTab : 0;
  }, [search]);

  // ưu tiên prop initialTab nếu có, không thì theo URL
  const computedInitialStep = useMemo(() => {
    if (initialTab && initialTab in TAB_TO_STEP) return TAB_TO_STEP[initialTab];
    return initialStepFromUrl;
  }, [initialTab, initialStepFromUrl]);

  const [step, setStep] = useState<number>(computedInitialStep); // 0..4
  useEffect(() => setStep(computedInitialStep), [computedInitialStep]);

  // buộc Review/Export remount sau khi editor được đổ html
  const [editorRefreshKey, setEditorRefreshKey] = useState(0);

  // Editor refs
  const editorRef = useRef<any>(null);
  const uploadedRef = useRef<Map<string, UploadedImage>>(new Map());
  const draftIdRef = useRef<string>(ulid()); // NEW dùng draftId; EDIT sẽ bỏ qua

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
    },
  });
  const { handleSubmit, formState, setValue, getValues, reset } = methods;
  const busy = formState.isSubmitting;

  // ========================= Helpers =========================

  /** Trả về tài liệu HTML đầy đủ (chưa inline), GIỮ id/class để inline chính xác */
  const getFullHtml = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return "";

    const css = ed.getCss();
    const htmlBody = ed.getHtml({ cleanId: false }); // GIỮ id/class

    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>${getValues("name") || "Template"}</title>
          ${css ? `<style>${css}</style>` : ""}
        </head>
        ${htmlBody}
      </html>`;
  }, [getValues]);

  /** Bản sync: chỉ ẩn preheader (chưa inline). */
  const getFullHtmlHiddenSync = useCallback(
    () => ensureHiddenPreheader(getFullHtml()),
    [getFullHtml]
  );

  /** Bản async: inline toàn bộ CSS rồi mới ẩn preheader. */
  const getFullHtmlHiddenInlined = useCallback(async () => {
    const { default: juice } = await import("juice");
    const full = getFullHtml(); // có <style> cho inliner đọc
    const inlined = juice(full); // chuyển về style=""
    return ensureHiddenPreheader(inlined);
  }, [getFullHtml]);

  /** Lấy metadata ảnh đã upload (dựa trên Map uploadedRef) */
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

  // parse & đổ HTML từ server vào GrapesJS (để export dùng đúng src mới)
  const parseFullHtml = useCallback((full: string) => {
    if (!full) return { css: "", body: "" };
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let css = "";
    let m: RegExpExecArray | null;
    while ((m = styleRegex.exec(full)) !== null) css += (m[1] || "") + "\n";
    const bodyMatch = full.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const body = bodyMatch ? bodyMatch[1] : full;
    return { css, body };
  }, []);

  const applyServerHtmlToEditor = useCallback(
    (fullHtml: string) => {
      const ed = editorRef.current;
      if (!ed || !fullHtml) return;
      const { css, body } = parseFullHtml(fullHtml);
      ed.setStyle(css || "");
      ed.setComponents(body || "");
    },
    [parseFullHtml]
  );

  // nếu editor chưa sẵn sàng, retry
  const applyHtmlWithRetry = useCallback(
    (fullHtml: string, retries = 12) => {
      const ed = editorRef.current;
      if (ed) {
        applyServerHtmlToEditor(fullHtml);
        setEditorRefreshKey((k) => k + 1);
        return;
      }
      if (retries > 0)
        setTimeout(() => applyHtmlWithRetry(fullHtml, retries - 1), 150);
    },
    [applyServerHtmlToEditor]
  );

  // ========================= Edit-mode: fetch DB & hydrate =========================
  const { data: tmplData } = useQuery({
    queryKey: ["emailTemplate", templateId],
    queryFn: () => getEmailTemplate(templateId as string),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!tmplData) return;
    reset({
      name: tmplData.name ?? "",
      slug: tmplData.slug ?? "",
      description: tmplData.description ?? "",
      price: Number(tmplData.price ?? 0),
      currency: (tmplData.currency as CurrencyEnum) ?? (defaultCurrency as any),
      hasImages: !!tmplData.hasImages,
      customerId: tmplData.customerId ?? null,
      thumbnailUrl: tmplData.urlThumbnail ?? null,
    });
    if (tmplData.html) applyHtmlWithRetry(tmplData.html);
  }, [tmplData, reset, defaultCurrency, applyHtmlWithRetry]);

  // ========================= Mutations =========================
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
    },
  });

  // ========================= Handlers =========================
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
    [extractImageMetas, getFullHtmlHiddenInlined, handleSubmit, createAsync]
  );

  // Update (edit-mode): không dùng images/draftId
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
    [getFullHtmlHiddenInlined, handleSubmit, updateAsync]
  );

  const setCurrency = (cur: CurrencyEnum) => {
    setValue("currency", cur);
    const params = new URLSearchParams(search.toString());
    params.set("currency", cur);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  const canGoNext = step < STEP_TITLES.length - 1;
  const canGoBack = step > 0;

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
