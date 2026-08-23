import Image from "next/image";
import Link from "next/link";
import {
  freePromoFor,
  recommendationRotationKey,
  recommendationsFor,
  upsellFor,
} from "@/lib/upsell";
import { localizeExtension } from "@/lib/extensions";
import { lifecycleCopy } from "@/lib/lifecycle-copy";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";

/**
 * Product pages keep the focused two-card pairing. Compact lifecycle pages
 * show two close matches plus one rotating discovery card.
 */
export default function CrossPromo({
  slug,
  compact = false,
  locale = DEFAULT_LOCALE,
}: {
  slug: string;
  compact?: boolean;
  locale?: Locale;
}) {
  const copy = lifecycleCopy(locale);
  const promotions = compact
    ? recommendationsFor(slug, { limit: 3, rotationKey: recommendationRotationKey("installed") }).map(({ extension }) => localizeExtension(extension, locale))
    : [upsellFor(slug), freePromoFor(slug)]
        .filter((extension): extension is NonNullable<typeof extension> => Boolean(extension))
        .map((extension) => localizeExtension(extension, locale));
  if (!promotions.length) return null;

  return (
    <section
      className={`cross-promo${compact ? " cross-promo--compact" : ""}`}
      aria-labelledby="cross-promo-title"
    >
      {compact ? null : <span className="pricing-section-kicker">{copy.more}</span>}
      <h2 id="cross-promo-title">
        {copy.more}
      </h2>
      <div className="cross-promo-grid">
        {promotions.map((extension) => {
          const isFree = extension.slug === "cleanfeed";
          const promoName = locale === "en" ? extension.promoName : extension.shortName;
          const promoDescription = locale === "en"
            ? extension.promoDescription
            : compact
              ? extension.installedHighlights[0]
              : extension.tagline;
          return (
          <Link
            className={`cross-promo-card${isFree ? " cross-promo-card--free" : ""}`}
            href={`/${extension.slug}`}
            key={extension.slug}
          >
            <Image src={extension.icon} alt="" width={44} height={44} />
            <div>
              <strong>
                {promoName}{" "}
                {isFree ? <span className="cross-promo-free">{copy.free}</span> : null}
              </strong>
              <span>{promoDescription}</span>
            </div>
            <em>{copy.explore}</em>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
