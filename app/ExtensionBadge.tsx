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
export function Rating({ ext }: { ext: Extension }) {
  if (hasUsableRating(ext)) {
    const rating = ext.rating as number;
    const full = Math.round(rating);
    return (
      <a
        className="rating"
        href={`${ext.storeUrl}/reviews`}
        target="_blank"
        rel="noreferrer"
      >
        <span className="rating-stars" aria-hidden="true">
          {"★".repeat(full)}
          {"☆".repeat(5 - full)}
        </span>
        <span className="rating-text">
          {rating.toFixed(1)} · {ext.reviews?.toLocaleString()} reviews
        </span>
        <span className="sr-only">
          Rated {rating.toFixed(1)} out of 5 from {ext.reviews} Chrome Web Store
          reviews
          {ext.ratingsUpdated ? `, as of ${ext.ratingsUpdated}` : ""}
        </span>
      </a>
    );
  }

  if (ext.newRelease) {
    return <span className="rating-new">New release</span>;
  }

  return null;
}
