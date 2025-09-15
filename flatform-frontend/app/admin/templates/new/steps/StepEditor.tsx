"use client";

import { useEffect, useRef, useState } from "react";
import {
  initEmailGrapesEditor,
  createPreheaderHelpers,
  PREHEADER_BLOCK,
  DEFAULT_HTML,
  NBSP,
  type UploadProvider,
} from "./grapes-editor";

export default function StepEditor({
  editorRef,
  uploadedRef,
  draftIdRef,
  uploadProvider,
  apiBase,
  onReady,
}: {
  editorRef: React.MutableRefObject<any>;
  uploadedRef: React.MutableRefObject<Map<string, any>>;
  draftIdRef: React.MutableRefObject<string>;
  uploadProvider?: UploadProvider;
  apiBase?: string | null;
  onReady?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [preHeader, setPreHeader] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted || !containerRef.current) return;

      const editor = await initEmailGrapesEditor({
        container: containerRef.current,
        draftId: draftIdRef.current,
        uploadedMap: uploadedRef.current,
        uploadProvider,
        apiBaseUrl: apiBase ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? undefined,
        height: "calc(100vh - 50px)",
        keepPresetBlocks: true,
        categories: {
          emailLayoutLabel: "Email Layouts",
          layoutLabel: "Default Layouts",
          emailLayoutOpen: true,
          layoutOpen: false,
        },
      });

      const {
        ensurePreHeaderComp,
        ensurePreHeaderDOM,
        setPreHeaderTextModel,
        readPreHeaderText,
        isPreHeaderComp,
      } = createPreheaderHelpers(editor);

      // Sync input when #pre-header changes
      const syncInputFromEditor = () => setPreHeader(readPreHeaderText());

      const onCompAddOrUpdate = (m: any) => {
        if (isPreHeaderComp(m)) syncInputFromEditor();
      };
      const onCompRemove = (m: any) => {
        if (isPreHeaderComp(m)) setPreHeader("");
      };

      editor.on("component:add", onCompAddOrUpdate);
      editor.on("component:update", onCompAddOrUpdate);
      editor.on("component:remove", onCompRemove);

      // Initial read on load
      editor.on("load", () => {
        try {
          syncInputFromEditor();
        } catch {}
        try {
          const comps = editor.getWrapper()?.components();
          const count =
            comps && typeof (comps as any).length === "number"
              ? (comps as any).length
              : 0;
          if (count === 0) editor.setComponents(DEFAULT_HTML);
        } catch {}
      });

      // expose editor
      editorRef.current = editor;
      onReady?.();

      // sync once if state already has value
      if (preHeader) setPreHeaderTextModel(preHeader);
    })();

    return () => {
      mounted = false;
      editorRef.current?.destroy?.();
      editorRef.current = null;
    };
  }, [editorRef, uploadedRef, draftIdRef, uploadProvider, apiBase, onReady]);

  // Input -> update MODEL (giữ logic cũ, có fallback DOM)
  const onChangePreHeader = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value || "";
    setPreHeader(val);

    const ed = editorRef.current;
    if (!ed) return;

    try {
      const comp = (ed.getWrapper()?.find?.("#pre-header") ?? [])[0];
      const safe = val.trim().length > 0 ? val : NBSP;
      if (comp) {
        comp.components(safe);
        comp.view?.render?.();
      } else {
        ed.addComponents(PREHEADER_BLOCK, { at: 0 });
        const created = (ed.getWrapper()?.find?.("#pre-header") ?? [])[0];
        if (created) {
          created.components(safe);
          created.view?.render?.();
        }
      }
    } catch {
      try {
        const d = (editorRef.current as any)?.Canvas.getDocument() as Document;
        let p = d.getElementById("pre-header") as HTMLElement | null;
        if (!p) {
          (editorRef.current as any)?.addComponents(PREHEADER_BLOCK, { at: 0 });
          p = d.getElementById("pre-header") as HTMLElement | null;
        }
        if (p) p.innerHTML = (val.trim().length > 0 ? val : NBSP) as string;
      } catch {}
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b px-4 py-2 text-sm text-gray-600">
        <div className="flex flex-col gap-2">
          <div>1. Editor</div>
          <label className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Pre-header</span>
            <input
              value={preHeader}
              onChange={onChangePreHeader}
              placeholder="Nhập pre-header (40-140 ký tự)"
              className="flex-1 rounded-md border px-3 py-1.5 text-sm"
              maxLength={180}
            />
            <span className="text-[11px] text-gray-500">{preHeader.length}/180</span>
          </label>
        </div>
      </div>

      <div ref={containerRef} className="min-h-[60vh]" />
    </div>
  );
}
