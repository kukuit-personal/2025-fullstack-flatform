// steps/grapes-editor/preheader.ts
import { NBSP, PREHEADER_BLOCK } from "./constants";

export function createPreheaderHelpers(editor: any) {
  const doc = () => editor.Canvas.getDocument() as Document;
  const findComp = (selector: string) =>
    (editor.getWrapper()?.find?.(selector) ?? [])[0] as any | undefined;

  const ensurePreHeaderComp = () => {
    let comp = findComp("#pre-header");
    if (!comp) {
      editor.addComponents(PREHEADER_BLOCK, { at: 0 });
      comp = findComp("#pre-header");
    }
    return comp;
  };

  const ensurePreHeaderDOM = () => {
    const d = doc();
    let p = d.getElementById("pre-header") as HTMLElement | null;
    if (!p) {
      editor.addComponents(PREHEADER_BLOCK, { at: 0 });
      p = d.getElementById("pre-header") as HTMLElement | null;
    }
    return p;
  };

  const setPreHeaderTextModel = (text: string) => {
    const comp = ensurePreHeaderComp();
    if (!comp) return;
    comp.components(text && text.trim() ? text : NBSP);
    comp.view?.render?.();
  };

  const readPreHeaderText = (): string => {
    try {
      const comp = findComp("#pre-header");
      const inner = (comp?.view?.el?.textContent as string | undefined) ?? "";
      const t1 = inner.replace(/\u00A0/g, " ").trim();
      if (t1) return t1;
    } catch {}
    try {
      const p = doc().getElementById("pre-header");
      const t2 = ((p?.textContent as string) || "").replace(/\u00A0/g, " ").trim();
      if (t2) return t2;
    } catch {}
    return "";
  };

  const isPreHeaderComp = (m: any) => (m?.getAttributes?.() || {}).id === "pre-header";

  return {
    ensurePreHeaderComp,
    ensurePreHeaderDOM,
    setPreHeaderTextModel,
    readPreHeaderText,
    isPreHeaderComp,
  };
}
