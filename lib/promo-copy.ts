import type { Extension } from "./extensions";
import type { Locale } from "./locales";

type PromoCopy = { name: string; description: string };

/** Compact copy for extension locale files that are missing or still English. */
const OVERRIDES: Partial<Record<Locale, Record<string, PromoCopy>>> = {
  sv: {
    "mass-unfriender": { name: "Facebook-vänner", description: "Granska och ta bort vänner i grupp" },
    "reddit-cleaner": { name: "Reddit-historik", description: "Radera inlägg och kommentarer i grupp" },
  },
  da: {
    "mass-unfriender": { name: "Facebook-venner", description: "Gennemgå og fjern venner samlet" },
    "reddit-cleaner": { name: "Reddit-historik", description: "Slet opslag og kommentarer samlet" },
    cleanfeed: { name: "Sociale feeds", description: "Skjul distraherende feeds på seks netværk" },
  },
  no: {
    "mass-unfriender": { name: "Facebook-venner", description: "Gå gjennom og fjern venner samlet" },
    "reddit-cleaner": { name: "Reddit-historikk", description: "Slett innlegg og kommentarer samlet" },
    cleanfeed: { name: "Sosiale feeder", description: "Skjul distraherende feeder på seks nettverk" },
  },
  fi: {
    "mass-unfriender": { name: "Facebook-kaverit", description: "Tarkista ja poista kavereita kerralla" },
    "reddit-cleaner": { name: "Reddit-historia", description: "Poista julkaisuja ja kommentteja kerralla" },
    cleanfeed: { name: "Sosiaaliset syötteet", description: "Piilota häiritsevät syötteet kuudessa verkostossa" },
  },
  he: {
    "mass-unfriender": { name: "חברים בפייסבוק", description: "בדיקה והסרה של חברים בכמות גדולה" },
    "reddit-cleaner": { name: "היסטוריית Reddit", description: "מחיקת פוסטים ותגובות בכמות גדולה" },
    cleanfeed: { name: "פידים חברתיים", description: "הסתרת פידים מסיחים בשש רשתות" },
  },
  cs: {
    "mass-unfriender": { name: "Přátelé na Facebooku", description: "Kontrolujte a hromadně odebírejte přátele" },
    "reddit-cleaner": { name: "Historie Redditu", description: "Hromadně mažte příspěvky a komentáře" },
  },
  pt_PT: {
    "mass-unfriender": { name: "Amigos do Facebook", description: "Reveja e remova amigos em massa" },
    "reddit-cleaner": { name: "Histórico do Reddit", description: "Elimine publicações e comentários em massa" },
    cleanfeed: { name: "Feeds sociais", description: "Oculte feeds que distraem em seis redes" },
  },
  es_419: {
    "mass-unfriender": { name: "Amigos de Facebook", description: "Revisa y elimina amigos en lote" },
    "reddit-cleaner": { name: "Historial de Reddit", description: "Elimina publicaciones y comentarios en lote" },
    cleanfeed: { name: "Feeds sociales", description: "Oculta feeds que distraen en seis redes" },
  },
  ro: {
    "mass-unfriender": { name: "Prieteni Facebook", description: "Verifică și elimină prieteni în bloc" },
    "reddit-cleaner": { name: "Istoric Reddit", description: "Șterge postări și comentarii în bloc" },
  },
  hu: {
    "mass-unfriender": { name: "Facebook-ismerősök", description: "Ismerősök áttekintése és tömeges eltávolítása" },
    "reddit-cleaner": { name: "Reddit-előzmények", description: "Bejegyzések és hozzászólások tömeges törlése" },
    cleanfeed: { name: "Közösségi hírfolyamok", description: "Zavaró hírfolyamok elrejtése hat hálózaton" },
  },
  el: {
    "facebook-instagram-cleaner": { name: "Μηνύματα Facebook + Instagram", description: "Καθαρίστε συνομιλίες Messenger και δικά σας Instagram DM" },
    "facebook-messenger-cleaner": { name: "Μηνύματα Facebook", description: "Διαγράψτε ή αρχειοθετήστε συνομιλίες μαζικά" },
    "mass-unfriender": { name: "Φίλοι Facebook", description: "Ελέγξτε και αφαιρέστε φίλους μαζικά" },
    "instagram-dm-cleaner": { name: "Μηνύματα Instagram", description: "Αναιρέστε μαζικά την αποστολή δικών σας μηνυμάτων" },
    "instagram-followers-tracker": { name: "Ακόλουθοι Instagram", description: "Παρακολουθήστε unfollowers και μη αμοιβαίους ακόλουθους" },
    "reddit-cleaner": { name: "Ιστορικό Reddit", description: "Διαγράψτε αναρτήσεις και σχόλια μαζικά" },
    cleanerx: { name: "Δραστηριότητα X", description: "Καθαρίστε αναρτήσεις, likes και ακολουθήσεις" },
    "facebook-activity-cleaner": { name: "Δραστηριότητα Facebook", description: "Καθαρίστε αναρτήσεις, φωτογραφίες, likes και ετικέτες" },
    cleanfeed: { name: "Ροές κοινωνικών δικτύων", description: "Κρύψτε ροές που αποσπούν την προσοχή σε έξι δίκτυα" },
  },
  bg: {
    "facebook-instagram-cleaner": { name: "Съобщения във Facebook + Instagram", description: "Почистете Messenger чатове и вашите Instagram съобщения" },
    "facebook-messenger-cleaner": { name: "Съобщения във Facebook", description: "Изтривайте или архивирайте разговори групово" },
    "mass-unfriender": { name: "Приятели във Facebook", description: "Преглеждайте и премахвайте приятели групово" },
    "instagram-dm-cleaner": { name: "Съобщения в Instagram", description: "Отменяйте изпращането на ваши съобщения групово" },
    "instagram-followers-tracker": { name: "Последователи в Instagram", description: "Следете отписвания и невзаимни последователи" },
    "reddit-cleaner": { name: "История в Reddit", description: "Изтривайте публикации и коментари групово" },
    cleanerx: { name: "Активност в X", description: "Почистете публикации, харесвания и следвания" },
    "facebook-activity-cleaner": { name: "Активност във Facebook", description: "Почистете публикации, снимки, харесвания и тагове" },
    cleanfeed: { name: "Социални емисии", description: "Скрийте разсейващи емисии в шест мрежи" },
  },
  sk: {
    "facebook-instagram-cleaner": { name: "Správy Facebook + Instagram", description: "Vyčistite konverzácie Messenger a vlastné Instagram správy" },
    "facebook-messenger-cleaner": { name: "Správy na Facebooku", description: "Hromadne odstráňte alebo archivujte konverzácie" },
    "mass-unfriender": { name: "Priatelia na Facebooku", description: "Kontrolujte a hromadne odoberajte priateľov" },
    "instagram-dm-cleaner": { name: "Správy na Instagrame", description: "Hromadne zrušte odoslanie vlastných správ" },
    "instagram-followers-tracker": { name: "Sledovatelia Instagramu", description: "Sledujte odchody a neopätované sledovania" },
    "reddit-cleaner": { name: "História Redditu", description: "Hromadne odstráňte príspevky a komentáre" },
    cleanerx: { name: "Aktivita na X", description: "Vyčistite príspevky, lajky a sledovania" },
    "facebook-activity-cleaner": { name: "Aktivita na Facebooku", description: "Vyčistite príspevky, fotky, lajky a označenia" },
    cleanfeed: { name: "Sociálne kanály", description: "Skryte rušivé kanály na šiestich sieťach" },
  },
  hr: {
    "facebook-instagram-cleaner": { name: "Facebook + Instagram poruke", description: "Očistite Messenger razgovore i vlastite Instagram poruke" },
    "facebook-messenger-cleaner": { name: "Facebook poruke", description: "Skupno izbrišite ili arhivirajte razgovore" },
    "mass-unfriender": { name: "Facebook prijatelji", description: "Pregledajte i skupno uklonite prijatelje" },
    "instagram-dm-cleaner": { name: "Instagram poruke", description: "Skupno poništite slanje vlastitih poruka" },
    "instagram-followers-tracker": { name: "Instagram pratitelji", description: "Pratite odlaske i one koji vas ne prate" },
    "reddit-cleaner": { name: "Reddit povijest", description: "Skupno izbrišite objave i komentare" },
    cleanerx: { name: "Aktivnost na X-u", description: "Očistite objave, lajkove i praćenja" },
    "facebook-activity-cleaner": { name: "Facebook aktivnost", description: "Očistite objave, fotografije, lajkove i oznake" },
    cleanfeed: { name: "Društveni feedovi", description: "Sakrijte ometajuće feedove na šest mreža" },
  },
  sl: {
    "facebook-instagram-cleaner": { name: "Sporočila Facebook + Instagram", description: "Počistite pogovore Messenger in lastna Instagram sporočila" },
    "facebook-messenger-cleaner": { name: "Sporočila Facebook", description: "Množično izbrišite ali arhivirajte pogovore" },
    "mass-unfriender": { name: "Prijatelji na Facebooku", description: "Preglejte in množično odstranite prijatelje" },
    "instagram-dm-cleaner": { name: "Sporočila Instagram", description: "Množično prekličite pošiljanje svojih sporočil" },
    "instagram-followers-tracker": { name: "Sledilci na Instagramu", description: "Spremljajte odhode in nevzajemne sledilce" },
    "reddit-cleaner": { name: "Zgodovina Reddita", description: "Množično izbrišite objave in komentarje" },
    cleanerx: { name: "Dejavnost na X", description: "Počistite objave, všečke in sledenja" },
    "facebook-activity-cleaner": { name: "Dejavnost na Facebooku", description: "Počistite objave, fotografije, všečke in oznake" },
    cleanfeed: { name: "Družbeni viri", description: "Skrijte moteče vire na šestih omrežjih" },
  },
  ms: {
    "facebook-instagram-cleaner": { name: "Mesej Facebook + Instagram", description: "Bersihkan perbualan Messenger dan DM Instagram anda" },
    "facebook-messenger-cleaner": { name: "Mesej Facebook", description: "Padam atau arkibkan perbualan secara pukal" },
    "mass-unfriender": { name: "Rakan Facebook", description: "Semak dan alih keluar rakan secara pukal" },
    "instagram-dm-cleaner": { name: "Mesej Instagram", description: "Batalkan penghantaran mesej anda secara pukal" },
    "instagram-followers-tracker": { name: "Pengikut Instagram", description: "Jejak yang berhenti dan tidak mengikuti kembali" },
    "reddit-cleaner": { name: "Sejarah Reddit", description: "Padam siaran dan komen secara pukal" },
    cleanerx: { name: "Aktiviti X", description: "Bersihkan siaran, suka dan ikutan" },
    "facebook-activity-cleaner": { name: "Aktiviti Facebook", description: "Bersihkan siaran, foto, suka dan tanda" },
    cleanfeed: { name: "Suapan sosial", description: "Sembunyikan suapan mengganggu di enam rangkaian" },
  },
};

const ACTIVITY_DESCRIPTION: Partial<Record<Locale, string>> = {
  de: "Beiträge, Fotos, Likes und Markierungen gesammelt bereinigen",
  ja: "投稿、写真、いいね、タグをまとめて整理",
  fr: "Nettoyez publications, photos, mentions J’aime et identifications",
  ko: "게시물, 사진, 좋아요, 태그를 한꺼번에 정리",
  nl: "Ruim berichten, foto’s, likes en tags in bulk op",
  it: "Pulisci in blocco post, foto, Mi piace e tag",
  es: "Limpia publicaciones, fotos, Me gusta y etiquetas en lote",
  pl: "Masowo usuwaj posty, zdjęcia, polubienia i oznaczenia",
  zh_TW: "批次清理貼文、相片、按讚和標註",
  zh_CN: "批量清理帖子、照片、点赞和标记",
  sv: "Rensa inlägg, foton, gilla-markeringar och taggar i grupp",
  da: "Ryd opslag, billeder, likes og tags samlet",
  no: "Rydd innlegg, bilder, likerklikk og tagger samlet",
  fi: "Siivoa julkaisuja, kuvia, tykkäyksiä ja tunnisteita kerralla",
  he: "ניקוי פוסטים, תמונות, לייקים ותגיות בכמות גדולה",
  cs: "Hromadně čistěte příspěvky, fotky, lajky a označení",
  pt_PT: "Limpe publicações, fotos, gostos e identificações em massa",
  pt_BR: "Limpe publicações, fotos, curtidas e marcações em massa",
  es_419: "Limpia publicaciones, fotos, Me gusta y etiquetas en lote",
  ar: "نظّف المنشورات والصور والإعجابات والإشارات دفعة واحدة",
  ro: "Curăță postări, fotografii, aprecieri și etichete în bloc",
  hu: "Bejegyzések, fotók, kedvelések és címkék tömeges törlése",
  tr: "Gönderileri, fotoğrafları, beğenileri ve etiketleri topluca temizleyin",
  th: "ล้างโพสต์ รูปภาพ การกดถูกใจ และแท็กเป็นชุด",
  id: "Bersihkan postingan, foto, suka, dan tag secara massal",
  vi: "Dọn bài viết, ảnh, lượt thích và thẻ hàng loạt",
};

export function promoCopy(extension: Extension, locale: Locale): PromoCopy {
  const override = OVERRIDES[locale]?.[extension.slug];
  return {
    name: override?.name ?? extension.promoName,
    description: override?.description ?? (
      extension.slug === "facebook-activity-cleaner"
        ? ACTIVITY_DESCRIPTION[locale] ?? extension.promoDescription
        : extension.promoDescription
    ),
  };
}
