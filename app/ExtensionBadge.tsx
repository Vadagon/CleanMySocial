import Image from "next/image";
import { hasUsableRating, type Extension } from "@/lib/extensions";

/**
 * An extension is never referred to by bare text — always its icon plus its
 * name, so the same thing looks like the same thing everywhere.
 */
export function ExtensionRow({
  ext,
  size = 32,
}: {
  ext: Extension;
  size?: number;
}) {
  return (
    <span className="ext-row">
      <Image
        className="ext-row-icon"
        src={ext.icon}
        alt=""
        width={size}
        height={size}
      />
      <span className="ext-row-name">{ext.name}</span>
    </span>
  );
}

/**
 * Real store rating, or an honest "new" label, or nothing at all. Never a
 * fabricated number — see the note on Extension.rating.
 */
export function Rating({
  ext,
  linked = true,
}: {
  ext: Extension;
  /** Home cards are already links, so their rating must not create a nested link. */
  linked?: boolean;
}) {
  const userCount =
    typeof ext.users === "number"
      ? `${ext.users.toLocaleString("en-US")} ${ext.users === 1 ? "user" : "users"}`
      : null;

  if (hasUsableRating(ext)) {
    const rating = ext.rating as number;
    const full = Math.round(rating);
    const contents = (
      <>
        <span className="rating-stars" aria-hidden="true">
          {"★".repeat(full)}
          {"☆".repeat(5 - full)}
        </span>
        <span className="rating-text">
          {rating.toFixed(1)} · {ext.reviews?.toLocaleString()} reviews
          {userCount ? ` · ${userCount}` : ""}
        </span>
        <span className="sr-only">
          Rated {rating.toFixed(1)} out of 5 from {ext.reviews} Chrome Web Store
          reviews
          {ext.ratingsUpdated ? `, as of ${ext.ratingsUpdated}` : ""}
          {userCount
            ? `. Used by ${userCount}${ext.usersUpdated ? ` as of ${ext.usersUpdated}` : ""}`
            : ""}
        </span>
      </>
    );

    if (!linked) {
      return <span className="rating">{contents}</span>;
    }

    return (
      <a
        className="rating"
        href={ext.storeUrl}
        target="_blank"
        rel="noreferrer"
      >
        {contents}
      </a>
    );
  }

  if (userCount) {
    const contents = (
      <>
        <span className="rating-user-icon" aria-hidden="true">●</span>
        <span className="rating-text">{userCount}</span>
        <span className="sr-only">
          Chrome Web Store user count
          {ext.usersUpdated ? ` as of ${ext.usersUpdated}` : ""}
        </span>
      </>
    );

    return linked ? (
      <a className="rating rating-users-only" href={ext.storeUrl} target="_blank" rel="noreferrer">
        {contents}
      </a>
    ) : (
      <span className="rating rating-users-only">{contents}</span>
    );
  }

  if (ext.newRelease) {
    return <span className="rating-new">New release</span>;
  }

  return null;
}
