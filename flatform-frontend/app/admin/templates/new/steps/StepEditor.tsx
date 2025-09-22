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

/** Chuẩn hoá style của 1 component: mọi giá trị -> string đã trim; xoá null/undefined; map "display: 0" -> "none" */
function normalizeOneComponent(cmp: any) {
  if (!cmp?.getStyle) return;
  const style = { ...(cmp.getStyle() || {}) } as Record<string, any>;
  let changed = false;

  for (const key of Object.keys(style)) {
    const v = style[key];
    if (v == null) {
      delete style[key];
      changed = true;
      continue;
    }
    if (typeof v !== "string") {
      style[key] = String(v);
      changed = true;
    }
    if (typeof style[key] === "string") {
      const trimmed = (style[key] as string).trim();
      if (trimmed !== style[key]) {
        style[key] = trimmed;
        changed = true;
      }
    }
  }

  // Một số HTML lỗi đặt display="0"
  if (style.display === "0") {
    style.display = "none";
    changed = true;
  }

  if (changed) {
    try {
      cmp.setStyle(style);
    } catch {
      /* noop */
    }
  }
}

/** Chuẩn hoá style cho toàn bộ cây component hiện tại */
function normalizeComponentStyles(editor: any) {
  try {
    const root = editor?.DomComponents?.getWrapper?.();
    if (!root) return;
    const all: any[] = [root, ...(root.find ? root.find("*") : [])];
    all.forEach(normalizeOneComponent);
  } catch {
    /* noop */
  }
}

export default function StepEditor({
  editorRef,
  uploadedRef,
  draftIdRef,
  templateId, // ⬅️ truyền thẳng templateId (edit); create thì undefined
  isEdit = false,
  uploadProvider,
  apiBase,
  onReady,
}: {
  editorRef: React.MutableRefObject<any>;
  uploadedRef: React.MutableRefObject<Map<string, any>>;
  draftIdRef: React.MutableRefObject<string>;
  templateId?: string; // ⬅️ NEW: thay cho storageKey
  isEdit?: boolean;
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

      // debug nhanh: đảm bảo templateId có mặt khi init
      console.debug("[StepEditor] init editor with templateId =", templateId);

      const editor = await initEmailGrapesEditor({
        container: containerRef.current,
        draftId: draftIdRef.current, // dùng khi create
        templateId, // ⬅️ ưu tiên khi edit
        isEdit,
        uploadedMap: uploadedRef.current,
        uploadProvider,
        apiBaseUrl:
          apiBase ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? undefined,
        height: "calc(100vh - 50px)",
        keepPresetBlocks: true,
        categories: {
          emailLayoutLabel: "Email Layouts",
          layoutLabel: "Default Layouts",
          emailLayoutOpen: true,
          layoutOpen: false,
        },
      });

      const { setPreHeaderTextModel, readPreHeaderText, isPreHeaderComp } =
        createPreheaderHelpers(editor);

      const syncInputFromEditor = () => setPreHeader(readPreHeaderText());

      // ---- Handlers ----
      const onCompAddOrUpdate = (m: any) => {
        // Normalize component nào vừa thêm/cập nhật
        normalizeOneComponent(m);
        if (isPreHeaderComp(m)) syncInputFromEditor();
      };

      const onCompRemove = (m: any) => {
        if (isPreHeaderComp(m)) setPreHeader("");
      };

      const onStyleUpdate = (cmp: any) => {
        normalizeOneComponent(cmp);
      };

      const onLoad = () => {
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

        // ✅ Sau khi editor load xong, normalize toàn bộ cây
        setTimeout(() => {
          normalizeComponentStyles(editor);
        }, 0);
      };

      // ---- Bind events ----
      editor.on("component:add", onCompAddOrUpdate);
      editor.on("component:update", onCompAddOrUpdate);
      editor.on("component:remove", onCompRemove);
      editor.on("component:styleUpdate", onStyleUpdate);
      editor.on("load", onLoad);

      // expose editor
      editorRef.current = editor;
      onReady?.();

      // nếu state preHeader đã có, đẩy vào model ngay sau khi init
      if (preHeader) setPreHeaderTextModel(preHeader);
    })();

    return () => {
      mounted = false;
      try {
        // cố gắng gỡ event trước khi destroy
        const ed = editorRef.current;
        if (ed?.off) {
          ed.off("component:add");
          ed.off("component:update");
          ed.off("component:remove");
          ed.off("component:styleUpdate");
          ed.off("load");
        }
        editorRef.current?.destroy?.();
      } catch {}
      editorRef.current = null;
    };
    // ⚠️ Không đưa `preHeader` vào deps để tránh re-init mỗi lần gõ chữ
  }, [
    editorRef,
    uploadedRef,
    draftIdRef,
    templateId, // ⬅️ khi templateId thay đổi (create → edit), re-init để uploader trỏ đúng đích
    isEdit,
    uploadProvider,
    apiBase,
    onReady,
  ]);

  // Input → update model (có fallback DOM)
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
        normalizeOneComponent(comp); // đảm bảo style sạch với component này
      } else {
        ed.addComponents(PREHEADER_BLOCK, { at: 0 });
        const created = (ed.getWrapper()?.find?.("#pre-header") ?? [])[0];
        if (created) {
          created.components(safe);
          created.view?.render?.();
          normalizeOneComponent(created);
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
            <span className="text-[11px] text-gray-500">
              {preHeader.length}/180
            </span>
          </label>
        </div>
      </div>

      <div ref={containerRef} className="min-h-[60vh]" />
    </div>
  );
}
