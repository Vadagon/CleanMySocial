import Image from "next/image";
import type { Extension } from "@/lib/extensions";
import type { Locale } from "@/lib/locales";

const chromeUserLabels: Record<Locale, { one: string; many: string }> = {
  en: { one: "Chrome user", many: "Chrome users" },
  de: { one: "Chrome-Nutzer", many: "Chrome-Nutzer" },
  ja: { one: "Chrome ユーザー", many: "Chrome ユーザー" },
  fr: { one: "utilisateur Chrome", many: "utilisateurs Chrome" },
  ko: { one: "Chrome 사용자", many: "Chrome 사용자" },
  nl: { one: "Chrome-gebruiker", many: "Chrome-gebruikers" },
  it: { one: "utente Chrome", many: "utenti Chrome" },
  es: { one: "usuario de Chrome", many: "usuarios de Chrome" },
  pl: { one: "użytkownik Chrome", many: "użytkowników Chrome" },
  zh_TW: { one: "Chrome 使用者", many: "Chrome 使用者" },
  zh_CN: { one: "Chrome 用户", many: "Chrome 用户" },
  sv: { one: "Chrome-användare", many: "Chrome-användare" },
  da: { one: "Chrome-bruger", many: "Chrome-brugere" },
  no: { one: "Chrome-bruker", many: "Chrome-brukere" },
  fi: { one: "Chrome-käyttäjä", many: "Chrome-käyttäjää" },
  he: { one: "משתמש Chrome", many: "משתמשי Chrome" },
  cs: { one: "uživatel Chromu", many: "uživatelů Chromu" },
  pt_PT: { one: "utilizador do Chrome", many: "utilizadores do Chrome" },
  pt_BR: { one: "usuário do Chrome", many: "usuários do Chrome" },
  es_419: { one: "usuario de Chrome", many: "usuarios de Chrome" },
  ar: { one: "مستخدم Chrome", many: "مستخدمو Chrome" },
  ro: { one: "utilizator Chrome", many: "utilizatori Chrome" },
  hu: { one: "Chrome-felhasználó", many: "Chrome-felhasználó" },
  tr: { one: "Chrome kullanıcısı", many: "Chrome kullanıcısı" },
  th: { one: "ผู้ใช้ Chrome", many: "ผู้ใช้ Chrome" },
  id: { one: "pengguna Chrome", many: "pengguna Chrome" },
  vi: { one: "người dùng Chrome", many: "người dùng Chrome" },
};

/**
 * An extension is never referred to by bare text — always its icon plus its
 * name, so the same thing looks like the same thing everywhere.
 */
export function ExtensionRow({
  ext,
  size = 32,
  compact = false,
}: {
  ext: Extension;
  size?: number;
  compact?: boolean;
}) {
  const compactNames: Record<string, string> = {
    "facebook-instagram-cleaner": "Facebook & Instagram Cleaner",
    "facebook-messenger-cleaner": "Messenger Cleaner",
    "mass-unfriender": "Facebook Friends Remover",
    "instagram-followers-tracker": "Instagram Followers Tracker",
  };

  return (
    <span className="ext-row">
      <Image
        className="ext-row-icon"
        src={ext.icon}
        alt=""
        width={size}
        height={size}
      />
      <span className="ext-row-name">
        {compact ? compactNames[ext.slug] || ext.name : ext.name}
      </span>
    </span>
  );
}

/** Public user count copied from the extension's Chrome Web Store listing. */
export function UserCount({
  ext,
  linked = true,
  locale = "en",
}: {
  ext: Extension;
  /** Home cards are already links, so the count must not create a nested link. */
  linked?: boolean;
  locale?: Locale;
}) {
  const labels = chromeUserLabels[locale];
  const contents = (
    <>
      <svg className="user-count-icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="6.25" r="3.25" />
        <path d="M3.75 17c.45-3.45 2.55-5.25 6.25-5.25s5.8 1.8 6.25 5.25" />
      </svg>
      {ext.users.toLocaleString(locale.replace("_", "-"))}+ {ext.users === 1 ? labels.one : labels.many}
    </>
  );

  if (!linked) {
    return <span className="user-count">{contents}</span>;
  }

  return (
    <a
      className="user-count"
      href={ext.storeUrl}
      target="_blank"
      rel="noreferrer"
      title={`Chrome Web Store user count as of ${ext.usersUpdated}`}
    >
      {contents}
    </a>
  );
}
