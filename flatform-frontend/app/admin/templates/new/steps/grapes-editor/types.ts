// steps/grapes-editor/types.ts
export type UploadProvider = "cloudinary" | "my-storage";

export type InitEditorOptions = {
  container: HTMLElement;
  draftId: string;
  uploadedMap: Map<string, any>;
  uploadProvider?: UploadProvider;
  apiBaseUrl?: string | null;
  height?: string;
  keepPresetBlocks?: boolean; // giữ block mặc định của preset
  categories?: {
    emailLayoutLabel?: string;
    layoutLabel?: string;
    emailLayoutOpen?: boolean;
    layoutOpen?: boolean;
  };
};
