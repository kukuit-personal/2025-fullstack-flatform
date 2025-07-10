// components/LanguageSwitcher.tsx
"use client";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export function LanguageSwitcher() {
  const router = useRouter();

  const changeLang = (lang: string) => {
    Cookies.set("NEXT_LOCALE", lang);
    router.refresh(); // Force reload dữ liệu bằng lang mới
  };

  return (
    <div>
      <button onClick={() => changeLang("vi")}>🇻🇳 Tiếng Việt</button>
      <button onClick={() => changeLang("en")}>🇺🇸 English</button>
    </div>
  );
}
