"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { createEmailTemplate } from "./service";
import { CurrencyEnum, CURRENCY_OPTIONS } from "./constants";
import { toCreatePayload } from "./adapter";
import { NewTemplateForm, NewTemplateFormValues } from "./types";

const loadGrapes = () => import("grapesjs");
const loadNewsletterPreset = () => import("grapesjs-preset-newsletter");

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const search = useSearchParams();

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  // ====== Form ======
  const defaultCurrency =
    (search.get("currency") as CurrencyEnum) || CurrencyEnum.VND;
  const form = useForm<NewTemplateFormValues>({
    resolver: zodResolver(NewTemplateForm),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      currency: defaultCurrency as CurrencyEnum,
      hasImages: true,
      customerId: null,
    },
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    getValues,
  } = form;

  // ====== Init GrapesJS ======
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ default: grapesjs }, { default: presetNewsletter }] =
        await Promise.all([loadGrapes(), loadNewsletterPreset()]);
      if (!mounted || !containerRef.current) return;
      const editor = grapesjs.init({
        container: containerRef.current,
        height: "calc(100vh - 260px)",
        fromElement: false,
        storageManager: false,
        plugins: [presetNewsletter],
        pluginsOpts: {
          "grapesjs-preset-newsletter": { showStylesOnChange: true },
        },
      });
      editorRef.current = editor;
    })();
    return () => {
      mounted = false;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

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

  // ====== Mutation ======
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => router.push("/admin/templates"),
  });

  const onSubmit = async (values: any) => {
    const html = getFullHtml();
    const payload = toCreatePayload(values, html);
    await mutateAsync(payload);
  };

  const setCurrency = (cur: CurrencyEnum) => {
    setValue("currency", cur);
    const params = new URLSearchParams(search.toString());
    params.set("currency", cur);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  const busy = isPending || isSubmitting;

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500">
        <span className="font-medium text-gray-800">Templates</span>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">New</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Create Email Template
        </h1>
        <button
          form="template-form"
          type="submit"
          disabled={busy}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Form */}
        <form
          id="template-form"
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1 space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              {...register("name")}
              className="w-full rounded-lg border px-3 py-2"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <input
              {...register("slug")}
              className="w-full rounded-lg border px-3 py-2"
            />
            {errors.slug && (
              <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              {...register("description")}
              className="w-full rounded-lg border px-3 py-2"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Price</label>
              <input
                type="number"
                {...register("price", { valueAsNumber: true })}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Currency</label>
              <select
                {...register("currency")}
                onChange={(e) => setCurrency(e.target.value as CurrencyEnum)}
                className="w-full rounded-lg border px-3 py-2"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="hasImages"
              type="checkbox"
              {...register("hasImages")}
              className="h-4 w-4"
            />
            <label htmlFor="hasImages" className="text-sm">
              Has images
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Customer</label>
            <input
              {...register("customerId", {
                setValueAs: (v) => (v === "" ? null : v),
              })}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </form>

        {/* Editor */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b px-4 py-2 text-sm text-gray-600">Editor</div>
          <div ref={containerRef} className="min-h-[60vh]" />
        </div>
      </div>
    </div>
  );
}
