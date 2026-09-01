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
  "zh_CN",
  "sv",
  "da",
  "no",
  "fi",
  "he",
  "cs",
  "pt_PT",
  "pt_BR",
  "es_419",
  "ar",
  "ro",
  "hu",
  "tr",
  "th",
  "id",
  "vi",
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
  zh_CN: "简体中文",
  sv: "Svenska",
  da: "Dansk",
  no: "Norsk",
  fi: "Suomi",
  he: "עברית",
  cs: "Čeština",
  pt_PT: "Português",
  pt_BR: "Português (Brasil)",
  es_419: "Español (Latinoamérica)",
  ar: "العربية",
  ro: "Română",
  hu: "Magyar",
  tr: "Türkçe",
  th: "ไทย",
  id: "Bahasa Indonesia",
  vi: "Tiếng Việt",
};

const SUPPORTED = new Set<string>(SUPPORTED_LOCALES);

/** Only accepts the exact locale codes used in public URL path segments. */
export function localeFromPathSegment(value: string | null | undefined): Locale | null {
  return value && SUPPORTED.has(value) ? value as Locale : null;
}

/** Convert Chrome/browser language tags to one of our supported locale codes. */
export function matchLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.trim().replaceAll("-", "_");
  if (SUPPORTED.has(normalized)) return normalized as Locale;

  const lower = normalized.toLowerCase();
  if (lower === "zh_tw" || lower === "zh_hant" || lower.startsWith("zh_hant_")) return "zh_TW";
  if (lower === "zh" || lower === "zh_cn" || lower === "zh_hans" || lower.startsWith("zh_hans_") || lower === "zh_sg") return "zh_CN";
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
  return locale === "he" || locale === "ar" ? "rtl" : "ltr";
}
