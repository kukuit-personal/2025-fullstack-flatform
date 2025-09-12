// steps/grapes-editor/categories.ts

export function setupCategories(editor: any, labels?: {
  emailLayoutLabel?: string;
  layoutLabel?: string;
  emailLayoutOpen?: boolean;
  layoutOpen?: boolean;
}) {
  const emailLayoutLabel = labels?.emailLayoutLabel ?? "Email Layouts";
  const layoutLabel = labels?.layoutLabel ?? "Default Layouts";
  const emailLayoutOpen = !!labels?.emailLayoutOpen;
  const layoutOpen = !!labels?.layoutOpen;

  const bm = editor.BlockManager;

  // Reset theo thứ tự mong muốn
  bm.getCategories().reset([
    { id: "email-layout", label: emailLayoutLabel, open: emailLayoutOpen, order: 1 },
    { id: "layout",       label: layoutLabel,     open: layoutOpen,     order: 2 },
  ]);
}

export function moveAllBlocksToCategory(editor: any, categoryId: string, label: string) {
  const bm = editor.BlockManager;
  bm.getAll().forEach((b: any) => {
    b.set("category", { id: categoryId, label });
  });
}

// Nếu muốn lọc, chỉ giữ 1 số block mặc định:
export function keepOnlyBlocks(editor: any, keepIds: string[], targetCategoryId = "layout", targetLabel = "Layout") {
  const keep = new Set(keepIds);
  const bm = editor.BlockManager;
  bm.getAll().forEach((b: any) => {
    const id = b.get("id");
    if (keep.has(id)) {
      b.set("category", { id: targetCategoryId, label: targetLabel });
    } else {
      bm.remove(id);
    }
  });
}
