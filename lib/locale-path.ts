import { DEFAULT_LOCALE, SUPPORTED_LOCALES, htmlLocale, type Locale } from "./locales";
import { SITE } from "./site";

/** Public path for a statically rendered locale. English keeps canonical URLs. */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

/** SEO language alternatives for one localized public page. */
export function localeAlternates(path: string): Record<string, string> {
  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      htmlLocale(locale),
      new URL(localePath(locale, path), SITE.url).toString(),
    ]),
  );
  return { ...languages, "x-default": new URL(localePath(DEFAULT_LOCALE, path), SITE.url).toString() };
}
