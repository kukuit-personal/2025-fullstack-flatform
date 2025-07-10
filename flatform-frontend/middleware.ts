import { NextRequest, NextResponse } from "next/server";
import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

const locales = ["en", "vi"];
const defaultLocale = "vi";

function getLocale(req: NextRequest): string {
  // 1. Ưu tiên cookie
  const cookieLang = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLang && locales.includes(cookieLang)) {
    return cookieLang;
  }

  // 2. Nếu không, lấy Accept-Language header
  const negotiatorHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  const matchedLocale = matchLocale(languages, locales, defaultLocale);
  return matchedLocale;
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Nếu không phải path cần xử lý (VD: API, public file), bỏ qua
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // Gắn header X-Locale cho client biết
  const locale = getLocale(req);
  const res = NextResponse.next();
  res.headers.set('x-next-intl-locale', locale);

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
