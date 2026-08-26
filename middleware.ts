import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { matchLocale } from "@/lib/locales";

const LEGACY_HOST = "cleanmysocial.verblike.com";
const CANONICAL_HOST = "cleanmysocial.com";

function requestHostname(request: NextRequest): string {
  return (request.headers.get("host") || request.nextUrl.hostname)
    .split(":", 1)[0]
    .toLowerCase();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Published extension versions can only connect to the legacy origin: it is
  // the sole CleanMySocial host in both their host_permissions and CSP. Never
  // redirect API calls to a different origin or Chrome will block the fetch.
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (requestHostname(request) !== LEGACY_HOST) {
    const locale = matchLocale(request.nextUrl.searchParams.get("lang"));
    if (!locale) return NextResponse.next();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-cleanmysocial-locale", locale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const destination = request.nextUrl.clone();
  destination.protocol = "https:";
  destination.hostname = CANONICAL_HOST;
  destination.port = "";
  return NextResponse.redirect(destination, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
