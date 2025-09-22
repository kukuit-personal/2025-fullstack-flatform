export type UploadedImage = {
  url: string;
  filename?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  bytes?: number;
};

export type TabKey = "editor" | "info" | "thumbnail" | "reviewsave" | "export";

export type TemplateWizardProps = {
  templateId?: string | null; // có templateId => edit mode
  initialTab?: TabKey;
};
