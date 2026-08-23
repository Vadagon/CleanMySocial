import { EXTENSIONS, getExtension } from "./extensions";
import type { Extension } from "./extensions";

export const FREE_PROMO_SLUG = "cleanfeed";

/** Same-network or closely related tools always shown first. */
export const STRONG_RECOMMENDATIONS: Record<string, string[]> = {
  "facebook-instagram-cleaner": ["mass-unfriender", "facebook-activity-cleaner"],
  "facebook-messenger-cleaner": ["mass-unfriender", "facebook-activity-cleaner"],
  "mass-unfriender": ["facebook-messenger-cleaner", "facebook-activity-cleaner"],
  "instagram-dm-cleaner": ["instagram-followers-tracker", "facebook-instagram-cleaner"],
  "instagram-followers-tracker": ["instagram-dm-cleaner", "facebook-instagram-cleaner"],
  "reddit-cleaner": ["cleanerx", "cleanfeed"],
  cleanerx: ["reddit-cleaner", "cleanfeed"],
  "facebook-activity-cleaner": ["mass-unfriender", "facebook-messenger-cleaner"],
  cleanfeed: ["facebook-instagram-cleaner", "mass-unfriender"],
};

/** Discovery pool for the rotating third card. Different networks are early. */
export const OPTIONAL_RECOMMENDATIONS = [
  "cleanerx",
  "reddit-cleaner",
  "instagram-followers-tracker",
  "mass-unfriender",
  "cleanfeed",
  "facebook-instagram-cleaner",
  "instagram-dm-cleaner",
  "facebook-activity-cleaner",
  "facebook-messenger-cleaner",
] as const;

export type Recommendation = {
  extension: Extension;
  strength: "strong" | "optional";
};

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Changes weekly, but stays stable during a visit and across hydration. */
export function recommendationRotationKey(surface: string): string {
  return `${surface}:${Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))}`;
}

export function recommendationsFor(
  slug: string,
  { limit = 3, rotationKey = "default" }: { limit?: number; rotationKey?: string } = {},
): Recommendation[] {
  const results: Recommendation[] = [];
  const seen = new Set([slug]);

  const add = (candidateSlug: string, strength: Recommendation["strength"]) => {
    if (seen.has(candidateSlug) || results.length >= limit) return;
    const extension = getExtension(candidateSlug);
    if (!extension) return;
    seen.add(candidateSlug);
    results.push({ extension, strength });
  };

  for (const candidate of STRONG_RECOMMENDATIONS[slug] ?? []) add(candidate, "strong");

  const optional = [
    ...OPTIONAL_RECOMMENDATIONS,
    ...EXTENSIONS.map((extension) => extension.slug),
  ].filter((candidate, index, items) => items.indexOf(candidate) === index);
  const offset = optional.length ? stableHash(`${slug}:${rotationKey}`) % optional.length : 0;
  for (let index = 0; index < optional.length; index += 1) {
    add(optional[(offset + index) % optional.length], "optional");
  }

  return results;
}

export function upsellFor(slug: string): Extension | null {
  const target = STRONG_RECOMMENDATIONS[slug]?.[0];
  if (!target || target === slug) return null;
  return getExtension(target) ?? null;
}

export function freePromoFor(slug: string): Extension | null {
  if (slug === FREE_PROMO_SLUG) return null;
  return EXTENSIONS.find((extension) => extension.slug === FREE_PROMO_SLUG) ?? null;
}
