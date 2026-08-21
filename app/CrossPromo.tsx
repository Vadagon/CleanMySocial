import Image from "next/image";
import Link from "next/link";
import { freePromoFor, upsellFor } from "@/lib/upsell";

/**
 * Two cards, always: one paid tool with no price shown, and CleanFeed, which
 * is free and says so.
 */
export default function CrossPromo({ slug }: { slug: string }) {
  const paid = upsellFor(slug);
  const free = freePromoFor(slug);
  if (!paid && !free) return null;

  return (
    <section className="cross-promo" aria-labelledby="cross-promo-title">
      <span className="pricing-section-kicker">More from CleanMySocial</span>
      <h2 id="cross-promo-title">People who clean this usually want these next</h2>
      <div className="cross-promo-grid">
        {paid ? (
          <Link className="cross-promo-card" href={`/${paid.slug}`}>
            <Image src={paid.icon} alt="" width={44} height={44} />
            <div>
              <strong>{paid.shortName}</strong>
              <span>{paid.tagline}</span>
            </div>
            <em>See what it does →</em>
          </Link>
        ) : null}
        {free ? (
          <Link className="cross-promo-card cross-promo-card--free" href={`/${free.slug}`}>
            <Image src={free.icon} alt="" width={44} height={44} />
            <div>
              <strong>
                {free.shortName} <span className="cross-promo-free">Unlimited</span>
              </strong>
              <span>{free.tagline}</span>
            </div>
            <em>Add to Chrome →</em>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
