import type { Promo } from "@/lib/blog";

/** Full advertisement box shown at the end of every article. */
export function PromoBox({ promo }: { promo: Promo }) {
  return (
    <aside className="promo-box" aria-label={`About ${promo.name}`}>
      <div className="promo-tag">Sponsored — our extension</div>
      <div className="promo-head">
        <span className="promo-emoji" aria-hidden="true">
          {promo.emoji}
        </span>
        <strong>{promo.name}</strong>
      </div>
      <p>{promo.pitch}</p>
      <ul>
        {promo.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <div className="promo-actions">
        <a
          className="promo-cta"
          href={promo.ctaHref}
          target="_blank"
          rel="noreferrer"
        >
          {promo.ctaLabel}
        </a>
        {promo.secondaryHref && (
          <a className="promo-secondary" href={promo.secondaryHref}>
            {promo.secondaryLabel}
          </a>
        )}
      </div>
    </aside>
  );
}

/** Compact inline callout, inserted mid-article at the [[PROMO]] marker. */
export function PromoInline({ promo }: { promo: Promo }) {
  return (
    <aside className="promo-inline">
      <span className="promo-emoji" aria-hidden="true">
        {promo.emoji}
      </span>
      <span>
        <strong>Skip the manual work:</strong> {promo.pitch}{" "}
        <a href={promo.ctaHref} target="_blank" rel="noreferrer">
          Get {promo.name} →
        </a>
      </span>
    </aside>
  );
}
