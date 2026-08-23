export const SUPPORTED_LOCALES = [
  "en",
  "de",
  "ja",
  "fr",
  "ko",
  "nl",
  "it",
  "es",
  "pl",
  "zh_TW",
  "sv",
  "da",
  "no",
  "fi",
  "he",
  "cs",
  "pt_PT",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  ja: "日本語",
  fr: "Français",
  ko: "한국어",
  nl: "Nederlands",
  it: "Italiano",
  es: "Español",
  pl: "Polski",
  zh_TW: "繁體中文",
  sv: "Svenska",
  da: "Dansk",
  no: "Norsk",
  fi: "Suomi",
  he: "עברית",
  cs: "Čeština",
  pt_PT: "Português",
};

const SUPPORTED = new Set<string>(SUPPORTED_LOCALES);

/** Convert Chrome/browser language tags to one of our supported locale codes. */
export function matchLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.trim().replaceAll("-", "_");
  if (SUPPORTED.has(normalized)) return normalized as Locale;

  const lower = normalized.toLowerCase();
  if (lower === "zh_tw" || lower === "zh_hant" || lower.startsWith("zh_hant_")) return "zh_TW";
  if (lower === "pt_pt" || lower.startsWith("pt_pt_")) return "pt_PT";

  const base = lower.split("_", 1)[0];
  if (SUPPORTED.has(base)) return base as Locale;
  return null;
}

export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const candidates = header
    .split(",")
    .map((part) => part.trim().split(";", 1)[0])
    .filter(Boolean);
  for (const candidate of candidates) {
    const locale = matchLocale(candidate);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
}

export function htmlLocale(locale: Locale): string {
  return locale.replaceAll("_", "-");
}

export function localeDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "he" ? "rtl" : "ltr";
}
