// steps/grapes-editor/types.ts
export type UploadProvider = "cloudinary" | "my-storage";

export type InitEditorOptions = {
  /** DOM container để mount GrapesJS */
  container: HTMLElement;

  /**
   * ID bản nháp (Create). FE có thể phát sinh bằng ulid().
   * Khi Edit vẫn có thể truyền (tương thích ngược) nhưng uploader sẽ ưu tiên templateId.
   */
  draftId: string;

  /**
   * ID template khi vào chế độ Edit.
   * Uploader sẽ ưu tiên dùng templateId (=> /assets/templates/<id>/...)
   * Nếu không có, sẽ dùng draftId (=> /assets/tmp/<draftId>/...)
   */
  templateId?: string;

  /** Flag chế độ Edit (tuỳ chọn, nếu init cần xử lý khác) */
  isEdit?: boolean;

  /** Map lưu metadata ảnh đã upload (src → meta) để FE trích xuất khi save */
  uploadedMap: Map<string, any>;

  /** Provider upload: Cloudinary hay storage tự triển khai */
  uploadProvider?: UploadProvider;

  /** Base URL của BE (nếu dùng my-storage) */
  apiBaseUrl?: string | null;

  /** Chiều cao editor */
  height?: string;

  /** Giữ preset blocks mặc định của plugin/preset */
  keepPresetBlocks?: boolean;

  /** Cấu hình tên/độ mở của các category trong block manager */
  categories?: {
    emailLayoutLabel?: string;
    layoutLabel?: string;
    emailLayoutOpen?: boolean;
    layoutOpen?: boolean;
  };
};
