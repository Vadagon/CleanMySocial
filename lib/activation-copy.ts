import type { Locale } from "./locales";

type ActivationCopy = { activate: string; activating: string };

const COPY: Record<Locale, ActivationCopy> = {
  en: { activate: "Activate", activating: "Activating…" },
  de: { activate: "Aktivieren", activating: "Wird aktiviert…" },
  ja: { activate: "有効にする", activating: "有効化しています…" },
  fr: { activate: "Activer", activating: "Activation…" },
  ko: { activate: "활성화", activating: "활성화 중…" },
  nl: { activate: "Activeren", activating: "Activeren…" },
  it: { activate: "Attiva", activating: "Attivazione…" },
  es: { activate: "Activar", activating: "Activando…" },
  pl: { activate: "Aktywuj", activating: "Aktywowanie…" },
  zh_TW: { activate: "啟用", activating: "正在啟用…" },
  zh_CN: { activate: "启用", activating: "正在启用…" },
  sv: { activate: "Aktivera", activating: "Aktiverar…" },
  da: { activate: "Aktivér", activating: "Aktiverer…" },
  no: { activate: "Aktiver", activating: "Aktiverer…" },
  fi: { activate: "Aktivoi", activating: "Aktivoidaan…" },
  he: { activate: "הפעלה", activating: "מפעיל…" },
  cs: { activate: "Aktivovat", activating: "Aktivace…" },
  pt_PT: { activate: "Ativar", activating: "A ativar…" },
  pt_BR: { activate: "Ativar", activating: "Ativando…" },
  es_419: { activate: "Activar", activating: "Activando…" },
  ar: { activate: "تفعيل", activating: "جارٍ التفعيل…" },
  ro: { activate: "Activează", activating: "Se activează…" },
  hu: { activate: "Aktiválás", activating: "Aktiválás…" },
  tr: { activate: "Etkinleştir", activating: "Etkinleştiriliyor…" },
  th: { activate: "เปิดใช้งาน", activating: "กำลังเปิดใช้งาน…" },
  id: { activate: "Aktifkan", activating: "Mengaktifkan…" },
  vi: { activate: "Kích hoạt", activating: "Đang kích hoạt…" },
  el: { activate: "Ενεργοποίηση", activating: "Ενεργοποίηση…" },
  bg: { activate: "Активиране", activating: "Активиране…" },
  sk: { activate: "Aktivovať", activating: "Aktivuje sa…" },
  hr: { activate: "Aktiviraj", activating: "Aktiviranje…" },
  sl: { activate: "Aktiviraj", activating: "Aktiviranje…" },
  ms: { activate: "Aktifkan", activating: "Mengaktifkan…" },
};

export function activationCopy(locale: Locale): ActivationCopy {
  return COPY[locale];
}
