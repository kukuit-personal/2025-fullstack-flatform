// steps/grapes-editor/index.ts
import type { InitEditorOptions, UploadProvider } from "./types";
export type { InitEditorOptions, UploadProvider } from "./types";

export { NBSP, PREHEADER_BLOCK, DEFAULT_HTML } from "./constants";
export { createPreheaderHelpers } from "./preheader";

import { setupCategories, moveAllBlocksToCategory } from "./categories";
import { registerCustomBlocks } from "./blocks";
import { makeUploadHandler } from "./upload";
import { DEFAULT_HTML as DEFAULT_HTML_CONST } from "./constants";

export async function initEmailGrapesEditor(opts: InitEditorOptions) {
  const [{ default: grapesjs }, { default: presetNewsletter }] = await Promise.all([
    import("grapesjs"),
    import("grapesjs-preset-newsletter"),
  ]);

  const provider: UploadProvider =
    opts.uploadProvider ||
    (process.env.NEXT_PUBLIC_UPLOAD_PROVIDER as UploadProvider) ||
    "cloudinary";

  // Forward ref: tạo handler dùng getter để tránh dùng biến trước khi khai báo
  let editor: any;
  const uploadFile = makeUploadHandler(() => editor, {
    provider,
    apiBaseUrl: opts.apiBaseUrl,
    draftId: opts.draftId,
    uploadedMap: opts.uploadedMap,
  });

  editor = grapesjs.init({
    container: opts.container,
    height: opts.height ?? "calc(100vh - 50px)",
    fromElement: false,
    storageManager: false,
    plugins: [presetNewsletter],
    pluginsOpts: {
      "grapesjs-preset-newsletter": {
        ...(opts.keepPresetBlocks ? {} : { blocks: [] }),
        showStylesOnChange: true,
      },
    },
    components: DEFAULT_HTML_CONST,
    assetManager: {
      upload: false,
      uploadFile, // <- dùng lazy getter, không lỗi TS nữa
    },
  });

  // Categories
  setupCategories(editor, {
    emailLayoutLabel: opts.categories?.emailLayoutLabel ?? "Email Layouts",
    layoutLabel: opts.categories?.layoutLabel ?? "Layout",
    emailLayoutOpen: !!opts.categories?.emailLayoutOpen,
    layoutOpen: !!opts.categories?.layoutOpen,
  });

  // Đưa block mặc định vào "Layout" và thêm block custom vào "Email layout"
  moveAllBlocksToCategory(editor, "layout", opts.categories?.layoutLabel ?? "Layout");
  registerCustomBlocks(editor, {
    categoryId: "email-layout",
    categoryLabel: opts.categories?.emailLayoutLabel ?? "Email Layouts",
  });

  return editor;
}
