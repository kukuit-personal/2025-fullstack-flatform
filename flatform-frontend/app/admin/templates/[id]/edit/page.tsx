// Server Component (không cần "use client")
import TemplateWizard from "../../new/ui/_templatewizard";

type Props = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

const VALID_TABS = [
  "editor",
  "info",
  "thumbnail",
  "reviewsave",
  "export",
] as const;
type Tab = (typeof VALID_TABS)[number];

function pickInitialTab(sp?: Props["searchParams"]): Tab {
  if (!sp) return "editor";
  // Ưu tiên ?tab=...
  const t = typeof sp.tab === "string" ? sp.tab : undefined;
  if (t && (VALID_TABS as readonly string[]).includes(t)) return t as Tab;
  // Hỗ trợ dạng ?reviewsave, ?export (không có key)
  for (const k of VALID_TABS) if (k in sp) return k;
  return "editor";
}

export default function Page({ params, searchParams }: Props) {
  const { id } = params;
  const initialTab = pickInitialTab(searchParams);
  return <TemplateWizard templateId={id} initialTab={initialTab} />;
}
