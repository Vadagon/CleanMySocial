import type { LifecycleCopy } from "./lifecycle-copy";
import type { Locale } from "./locales";

const COPY: Partial<Record<Exclude<Locale, "en">, { works: string; control: string }>> = {
  de: { works: "Funktioniert direkt auf {platform}", control: "Du entscheidest über jede Aktion" },
  ja: { works: "{platform} 上で直接動作", control: "すべての操作を自分で選べます" },
  fr: { works: "Fonctionne directement sur {platform}", control: "Vous gardez le contrôle de chaque action" },
  ko: { works: "{platform}에서 바로 작동", control: "모든 작업을 직접 선택합니다" },
  nl: { works: "Werkt rechtstreeks op {platform}", control: "Jij bepaalt elke actie" },
  it: { works: "Funziona direttamente su {platform}", control: "Decidi tu ogni azione" },
  es: { works: "Funciona directamente en {platform}", control: "Tú decides cada acción" },
  pl: { works: "Działa bezpośrednio w {platform}", control: "Ty decydujesz o każdej czynności" },
  zh_TW: { works: "直接在 {platform} 上運作", control: "每個操作都由你決定" },
  sv: { works: "Fungerar direkt på {platform}", control: "Du väljer varje åtgärd" },
  da: { works: "Fungerer direkte på {platform}", control: "Du vælger hver handling" },
  no: { works: "Fungerer direkte på {platform}", control: "Du velger hver handling" },
  fi: { works: "Toimii suoraan palvelussa {platform}", control: "Sinä päätät jokaisesta toiminnosta" },
  he: { works: "פועל ישירות בתוך {platform}", control: "כל פעולה מתבצעת רק לפי בחירתך" },
  cs: { works: "Funguje přímo na {platform}", control: "Každou akci volíte vy" },
  pt_PT: { works: "Funciona diretamente em {platform}", control: "Cada ação é escolhida por si" },
  pt_BR: { works: "Funciona diretamente no {platform}", control: "Você decide cada ação" },
  es_419: { works: "Funciona directamente en {platform}", control: "Tú decides cada acción" },
  ar: { works: "يعمل مباشرة على {platform}", control: "أنت من يختار كل إجراء" },
  ro: { works: "Funcționează direct pe {platform}", control: "Tu decizi fiecare acțiune" },
  hu: { works: "Közvetlenül a(z) {platform} felületén működik", control: "Minden műveletről te döntesz" },
  zh_CN: { works: "直接在 {platform} 中运行", control: "每一步操作都由你决定" },
  tr: { works: "Doğrudan {platform} üzerinde çalışır", control: "Her işlemi siz seçersiniz" },
  th: { works: "ทำงานโดยตรงบน {platform}", control: "คุณเป็นผู้เลือกทุกการดำเนินการ" },
  id: { works: "Berfungsi langsung di {platform}", control: "Anda menentukan setiap tindakan" },
  vi: { works: "Hoạt động trực tiếp trên {platform}", control: "Bạn quyết định mọi thao tác" },
  el: { works: "Λειτουργεί απευθείας στο {platform}", control: "Εσείς αποφασίζετε κάθε ενέργεια" },
  bg: { works: "Работи директно в {platform}", control: "Вие решавате всяко действие" },
  sk: { works: "Funguje priamo na {platform}", control: "Každú akciu si vyberáte vy" },
  hr: { works: "Radi izravno na {platform}", control: "Vi odlučujete o svakoj radnji" },
  sl: { works: "Deluje neposredno na {platform}", control: "O vsakem dejanju odločate vi" },
  ms: { works: "Berfungsi terus di {platform}", control: "Anda menentukan setiap tindakan" },
  uk: { works: "Працює безпосередньо в {platform}", control: "Кожну дію обираєте ви" },
  lt: { works: "Veikia tiesiai platformoje {platform}", control: "Kiekvieną veiksmą renkatės jūs" },
  lv: { works: "Darbojas tieši platformā {platform}", control: "Katru darbību izvēlaties jūs" },
  et: { works: "Töötab otse teenuses {platform}", control: "Iga toimingu valid sina" },
  hi: { works: "सीधे {platform} पर काम करता है", control: "हर कार्रवाई आप ही चुनते हैं" },
  fil: { works: "Direktang gumagana sa {platform}", control: "Pinipili mo ang bawat aksyon" },
};

export function installedHighlights(
  locale: Locale,
  platform: string,
  productHighlights: [string, string, string],
  lifecycle: LifecycleCopy,
): [string, string, string] {
  if (locale === "en") return productHighlights;
  const translated = COPY[locale];
  if (!translated) return productHighlights;
  return [
    translated.works.replaceAll("{platform}", platform),
    translated.control,
    lifecycle.dataBrowser,
  ];
}
