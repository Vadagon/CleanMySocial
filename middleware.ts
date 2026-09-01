import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, localeFromPathSegment, matchLocale } from "@/lib/locales";
import { EXTENSION_STATIC_SLUGS } from "@/lib/extension-routing";

const LEGACY_HOST = "cleanmysocial.verblike.com";
const CANONICAL_HOST = "cleanmysocial.com";
const PRODUCT_PATHS = new Set(EXTENSION_STATIC_SLUGS.map((slug) => `/${slug}`));

function requestHostname(request: NextRequest): string {
  return (request.headers.get("host") || request.nextUrl.hostname)
    .split(":", 1)[0]
    .toLowerCase();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const destination = request.nextUrl.clone();
  let redirect = false;

  // Backward compatibility for extension versions that still open ?lang=xx.
  // The destination is now a pre-rendered locale path, not a request header
  // that forces every page through a server function.
  const rawLocale = destination.searchParams.get("lang");
  const locale = matchLocale(rawLocale);
  if (rawLocale && locale) {
    destination.searchParams.delete("lang");
    const segments = pathname.split("/").filter(Boolean);
    const pathLocale = localeFromPathSegment(segments[0]);
    const unprefixedPath = pathLocale ? `/${segments.slice(1).join("/")}` || "/" : pathname;
    const localizable = unprefixedPath === "/"
      || PRODUCT_PATHS.has(unprefixedPath)
      || unprefixedPath === "/installed"
      || unprefixedPath.startsWith("/installed/")
      || unprefixedPath.startsWith("/uninstalled/");

    if (localizable) {
      destination.pathname = locale === DEFAULT_LOCALE
        ? unprefixedPath
        : unprefixedPath === "/"
          ? `/${locale}`
          : `/${locale}${unprefixedPath}`;
    }
    redirect = true;
  }

  if (requestHostname(request) === LEGACY_HOST) {
    destination.protocol = "https:";
    destination.hostname = CANONICAL_HOST;
    destination.port = "";
    redirect = true;
  }

  return redirect ? NextResponse.redirect(destination, 308) : NextResponse.next();
}

export const config = {
  // Keep middleware away from APIs and immutable/public assets. These requests
  // do not need locale or host routing and were creating avoidable Edge work.
  matcher: [
    "/((?!api(?:/|$)|_next/static|_next/image|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|woff|woff2|ttf|otf)$).*)",
  ],
};
