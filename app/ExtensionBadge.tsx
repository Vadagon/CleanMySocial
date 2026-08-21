import Image from "next/image";
import type { Extension } from "@/lib/extensions";

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
}: {
  ext: Extension;
  /** Home cards are already links, so the count must not create a nested link. */
  linked?: boolean;
}) {
  // 0 means no real figure has been read off the store listing yet — a newly
  // published extension. Say "New" rather than inventing a number.
  const isNew = !ext.users;
  const contents = isNew ? (
    <>
      <svg className="user-count-icon" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 2.5 12 7.6l5.5.4-4.2 3.5 1.3 5.3L10 14l-4.6 2.8 1.3-5.3L2.5 8l5.5-.4z" />
      </svg>
      New in the Chrome Web Store
    </>
  ) : (
    <>
      <svg className="user-count-icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="6.25" r="3.25" />
        <path d="M3.75 17c.45-3.45 2.55-5.25 6.25-5.25s5.8 1.8 6.25 5.25" />
      </svg>
      {ext.users.toLocaleString("en-US")}+ Chrome users
    </>
  );

  if (!linked) {
    return <span className={`user-count${isNew ? " user-count--new" : ""}`}>{contents}</span>;
  }

  return (
    <a
      className={`user-count${isNew ? " user-count--new" : ""}`}
      href={ext.storeUrl}
      target="_blank"
      rel="noreferrer"
      title={
        isNew
          ? "Recently published in the Chrome Web Store"
          : `Chrome Web Store user count as of ${ext.usersUpdated}`
      }
    >
      {contents}
    </a>
  );
}
