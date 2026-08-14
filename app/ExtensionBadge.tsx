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
  const formattedUsers = ext.users.toLocaleString("en-US");
  const contents = (
    <>
      <svg className="user-count-icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="6.25" r="3.25" />
        <path d="M3.75 17c.45-3.45 2.55-5.25 6.25-5.25s5.8 1.8 6.25 5.25" />
      </svg>
      {formattedUsers}+ Chrome users
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
