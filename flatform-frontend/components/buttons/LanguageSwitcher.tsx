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
    <div className="flex justify-center gap-1">
      <button
        onClick={() => changeLang("vi")}
        className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition"
      >
        🇻🇳 Tiếng Việt
      </button>
      <button
        onClick={() => changeLang("en")}
        className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition"
      >
        🇺🇸 English
      </button>
    </div>
  );
}
