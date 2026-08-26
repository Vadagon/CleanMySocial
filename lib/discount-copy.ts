import type { Locale } from "./locales";

export type DiscountCopy = {
  badge: string;
  claim: string;
  recovery: string;
  passLabel: string;
  passCadence: string;
  cta: string;
};

const COPY: Record<Locale, DiscountCopy> = {
  en: { badge: "50% off", claim: "Claim 50% off", recovery: "Get 50% off a 3-day pass, just for you.", passLabel: "🔥 3-Day Pass", passCadence: "One-time payment", cta: "Get 3-Day Access" },
  de: { badge: "50 % Rabatt", claim: "50 % Rabatt sichern", recovery: "Sichere dir 50 % Rabatt auf einen 3-Tage-Pass.", passLabel: "🔥 3-Tage-Pass", passCadence: "Einmalige Zahlung", cta: "3-Tage-Zugang sichern" },
  ja: { badge: "50%オフ", claim: "50%オフを利用", recovery: "3日間パスを50%オフで利用できます。", passLabel: "🔥 3日間パス", passCadence: "1回払い", cta: "3日間アクセスを購入" },
  fr: { badge: "-50 %", claim: "Profiter de -50 %", recovery: "Profitez de 50 % de réduction sur un pass de 3 jours.", passLabel: "🔥 Pass 3 jours", passCadence: "Paiement unique", cta: "Obtenir l’accès 3 jours" },
  ko: { badge: "50% 할인", claim: "50% 할인받기", recovery: "3일 패스를 50% 할인된 가격으로 이용하세요.", passLabel: "🔥 3일 패스", passCadence: "일회성 결제", cta: "3일 이용권 받기" },
  nl: { badge: "50% korting", claim: "Pak 50% korting", recovery: "Ontvang 50% korting op een 3-daagse pas.", passLabel: "🔥 3-daagse pas", passCadence: "Eenmalige betaling", cta: "Neem 3 dagen toegang" },
  it: { badge: "50% di sconto", claim: "Ottieni il 50%", recovery: "Ottieni il 50% di sconto su un pass di 3 giorni.", passLabel: "🔥 Pass di 3 giorni", passCadence: "Pagamento unico", cta: "Ottieni 3 giorni di accesso" },
  es: { badge: "50 % dto.", claim: "Obtener 50 % dto.", recovery: "Obtén un 50 % de descuento en el pase de 3 días.", passLabel: "🔥 Pase de 3 días", passCadence: "Pago único", cta: "Obtener acceso de 3 días" },
  pl: { badge: "50% taniej", claim: "Odbierz 50% zniżki", recovery: "Odbierz 50% zniżki na 3-dniowy dostęp.", passLabel: "🔥 Dostęp na 3 dni", passCadence: "Płatność jednorazowa", cta: "Kup dostęp na 3 dni" },
  zh_TW: { badge: "五折優惠", claim: "領取五折優惠", recovery: "專屬 3 天方案五折優惠。", passLabel: "🔥 3 天方案", passCadence: "單次付款", cta: "取得 3 天權限" },
  zh_CN: { badge: "五折优惠", claim: "领取五折优惠", recovery: "专属 3 天方案五折优惠。", passLabel: "🔥 3 天方案", passCadence: "单次付款", cta: "获取 3 天权限" },
  sv: { badge: "50 % rabatt", claim: "Få 50 % rabatt", recovery: "Få 50 % rabatt på ett 3-dagarspass.", passLabel: "🔥 3-dagarspass", passCadence: "Engångsbetalning", cta: "Få 3 dagars åtkomst" },
  da: { badge: "50 % rabat", claim: "Få 50 % rabat", recovery: "Få 50 % rabat på et 3-dagespas.", passLabel: "🔥 3-dagespas", passCadence: "Engangsbetaling", cta: "Få 3 dages adgang" },
  no: { badge: "50 % rabatt", claim: "Få 50 % rabatt", recovery: "Få 50 % rabatt på et 3-dagerspass.", passLabel: "🔥 3-dagerspass", passCadence: "Engangsbetaling", cta: "Få 3 dagers tilgang" },
  fi: { badge: "50 % alennus", claim: "Lunasta 50 % alennus", recovery: "Saat 3 päivän passin 50 % alennuksella.", passLabel: "🔥 3 päivän passi", passCadence: "Kertamaksu", cta: "Hanki 3 päivän käyttö" },
  he: { badge: "50% הנחה", claim: "קבלת 50% הנחה", recovery: "קבלו 50% הנחה על גישה ל־3 ימים.", passLabel: "🔥 גישה ל־3 ימים", passCadence: "תשלום חד־פעמי", cta: "קבלת גישה ל־3 ימים" },
  cs: { badge: "Sleva 50 %", claim: "Získat slevu 50 %", recovery: "Získejte 50% slevu na třídenní přístup.", passLabel: "🔥 Přístup na 3 dny", passCadence: "Jednorázová platba", cta: "Získat přístup na 3 dny" },
  pt_PT: { badge: "50% de desconto", claim: "Obter 50% de desconto", recovery: "Obtenha 50% de desconto num passe de 3 dias.", passLabel: "🔥 Passe de 3 dias", passCadence: "Pagamento único", cta: "Obter acesso por 3 dias" },
  pt_BR: { badge: "50% de desconto", claim: "Ganhar 50% de desconto", recovery: "Ganhe 50% de desconto no passe de 3 dias.", passLabel: "🔥 Passe de 3 dias", passCadence: "Pagamento único", cta: "Obter acesso por 3 dias" },
  es_419: { badge: "50 % de descuento", claim: "Obtener 50 % de descuento", recovery: "Obtén un 50 % de descuento en el pase de 3 días.", passLabel: "🔥 Pase de 3 días", passCadence: "Pago único", cta: "Obtener acceso de 3 días" },
  ar: { badge: "خصم 50٪", claim: "احصل على خصم 50٪", recovery: "احصل على خصم 50٪ على وصول لمدة 3 أيام.", passLabel: "🔥 وصول لمدة 3 أيام", passCadence: "دفعة واحدة", cta: "احصل على وصول 3 أيام" },
  ro: { badge: "Reducere 50%", claim: "Obține reducerea de 50%", recovery: "Primești 50% reducere la accesul de 3 zile.", passLabel: "🔥 Acces pentru 3 zile", passCadence: "Plată unică", cta: "Obține acces pentru 3 zile" },
  hu: { badge: "50% kedvezmény", claim: "50% kedvezmény kérése", recovery: "50% kedvezményt kapsz a 3 napos hozzáférésből.", passLabel: "🔥 3 napos hozzáférés", passCadence: "Egyszeri fizetés", cta: "3 napos hozzáférés kérése" },
  tr: { badge: "%50 indirim", claim: "%50 indirimi al", recovery: "3 günlük erişimde %50 indirim kazanın.", passLabel: "🔥 3 Günlük Geçiş", passCadence: "Tek seferlik ödeme", cta: "3 Günlük Erişim Al" },
  th: { badge: "ลด 50%", claim: "รับส่วนลด 50%", recovery: "รับส่วนลด 50% สำหรับแพ็กเกจ 3 วัน", passLabel: "🔥 แพ็กเกจ 3 วัน", passCadence: "ชำระครั้งเดียว", cta: "รับสิทธิ์ 3 วัน" },
  id: { badge: "Diskon 50%", claim: "Ambil diskon 50%", recovery: "Dapatkan diskon 50% untuk akses 3 hari.", passLabel: "🔥 Akses 3 Hari", passCadence: "Sekali bayar", cta: "Dapatkan Akses 3 Hari" },
  vi: { badge: "Giảm 50%", claim: "Nhận ưu đãi 50%", recovery: "Nhận giảm giá 50% cho gói truy cập 3 ngày.", passLabel: "🔥 Gói 3 ngày", passCadence: "Thanh toán một lần", cta: "Nhận quyền truy cập 3 ngày" },
};

export function discountCopy(locale: Locale): DiscountCopy {
  return COPY[locale];
}
