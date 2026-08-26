import "server-only";
import { headers } from "next/headers";
import { localeFromAcceptLanguage, matchLocale, type Locale } from "./locales";

/** Explicit lifecycle-page language wins; browser language is the fallback. */
export async function getRequestLocale(explicit?: string | string[]): Promise<Locale> {
  const requested = Array.isArray(explicit) ? explicit[0] : explicit;
  const matched = matchLocale(requested);
  if (matched) return matched;
  const requestHeaders = await headers();
  const routed = matchLocale(requestHeaders.get("x-cleanmysocial-locale"));
  if (routed) return routed;
  return localeFromAcceptLanguage(requestHeaders.get("accept-language"));
}
