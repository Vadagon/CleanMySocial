import { EXTENSIONS, getExtension } from "./extensions";
import type { Extension } from "./extensions";

/**
 * Every product page promotes exactly two other tools:
 *
 *  1. one paid tool, chosen because it solves the *next* problem for the same
 *     person — deliberately shown without a price, so the click is about
 *     interest rather than a second purchase decision;
 *  2. CleanFeed, which is free, and is always the second card.
 *
 * There are no bundles or combos; this pairing is the whole upsell.
 */
export const FREE_PROMO_SLUG = "cleanfeed";

const UPSELL: Record<string, string> = {
  // Cleaned your Instagram DMs? The next Instagram question is who follows you.
  "instagram-dm-cleaner": "instagram-followers-tracker",
  "instagram-followers-tracker": "instagram-dm-cleaner",
  // Facebook people-management pairs with Facebook content cleanup.
  "facebook-messenger-cleaner": "mass-unfriender",
  "mass-unfriender": "facebook-activity-cleaner",
  "facebook-activity-cleaner": "mass-unfriender",
  "facebook-instagram-cleaner": "instagram-followers-tracker",
  // Both are "delete your own back catalogue" tools on text-first networks.
  "reddit-cleaner": "cleanerx",
  "cleanerx": "reddit-cleaner",
  // The free tool sends people to the busiest paid one.
  cleanfeed: "facebook-instagram-cleaner",
};

export function upsellFor(slug: string): Extension | null {
  const target = UPSELL[slug];
  if (!target || target === slug) return null;
  return getExtension(target) ?? null;
}

export function freePromoFor(slug: string): Extension | null {
  if (slug === FREE_PROMO_SLUG) return null;
  return EXTENSIONS.find((extension) => extension.slug === FREE_PROMO_SLUG) ?? null;
}
