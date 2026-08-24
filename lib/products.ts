// Every sellable Creem product, and exactly which extensions it unlocks.
//
// Each paid extension is sold on its own, two ways: monthly, or lifetime at
// twice the monthly price. Bundles and combos were retired — the entries at the
// bottom of PRODUCTS stay only so existing licences keep resolving.

/** Slugs that can be entitled. Must match Extension.slug in extensions.ts. */
export type PremiumSlug =
  | "facebook-instagram-cleaner"
  | "facebook-messenger-cleaner"
  | "mass-unfriender"
  | "instagram-dm-cleaner"
  | "instagram-followers-tracker"
  | "reddit-cleaner"
  | "cleanerx"
  | "facebook-activity-cleaner";

/** Every paid extension, in the order they should be listed. */
export const ALL_PREMIUM_SLUGS: PremiumSlug[] = [
  "facebook-instagram-cleaner",
  "facebook-messenger-cleaner",
  "mass-unfriender",
  "instagram-dm-cleaner",
  "instagram-followers-tracker",
  "reddit-cleaner",
  "cleanerx",
  "facebook-activity-cleaner",
];

/**
 * What the retired bundles and combos unlocked — the five tools that existed
 * when they were sold. Never add to this list: extensions released afterwards
 * were not paid for by those customers, and licence records written before
 * per-product entitlements fall back to exactly this set.
 */
export const BUNDLE_ENTITLEMENTS: PremiumSlug[] = [
  "facebook-instagram-cleaner",
  "facebook-messenger-cleaner",
  "mass-unfriender",
  "instagram-dm-cleaner",
  "instagram-followers-tracker",
];

export type ProductKind = "single" | "combo" | "bundle";
export type BillingType = "onetime" | "recurring";
export type BillingPeriod = "once" | "every-month";
export type ProductAccess = "lifetime" | "subscription";

export interface Product {
  /** Creem product id */
  id: string;
  name: string;
  /** display price, e.g. "$11.99" */
  price: string;
  /** cents, for analytics */
  amount: number;
  kind: ProductKind;
  billingType: BillingType;
  billingPeriod: BillingPeriod;
  access: ProductAccess;
  /** public detail page slug, retired packages only */
  slug?: string;
  entitlements: PremiumSlug[];
  /** shown on the pricing page */
  blurb?: string;
  /** struck-through comparison, retired packages only */
  compareAt?: string;
  /** retired products stay resolvable for old customers but are never sold */
  retired?: boolean;
}

/**
 * Every extension is sold two ways: a monthly subscription, or a one-time
 * lifetime licence at twice the monthly price. There are no bundles or combos —
 * the retired ones below stay resolvable for the people who bought them.
 *
 * Creem ids are created by scripts/create-creem-products.mjs, which writes the
 * real ids back into this file. A PLACEHOLDER id is never sellable.
 */
export const PLACEHOLDER_PREFIX = "prod_PLACEHOLDER_";

function pair(
  slug: PremiumSlug,
  name: string,
  monthly: { id: string; price: string; amount: number },
  lifetime: { id: string; price: string; amount: number },
): Product[] {
  return [
    {
      id: monthly.id,
      name: `${name} — Monthly`,
      price: monthly.price,
      amount: monthly.amount,
      kind: "single",
      billingType: "recurring",
      billingPeriod: "every-month",
      access: "subscription",
      entitlements: [slug],
    },
    {
      id: lifetime.id,
      name: `${name} — Lifetime`,
      price: lifetime.price,
      amount: lifetime.amount,
      kind: "single",
      billingType: "onetime",
      billingPeriod: "once",
      access: "lifetime",
      entitlements: [slug],
    },
  ];
}

export const PRODUCTS: Product[] = [
  ...pair(
    "facebook-instagram-cleaner",
    "Delete All Messages for Facebook & Instagram",
    { id: "prod_7etiEEcsvj1BBHR4mMzkrA", price: "$11.99", amount: 1199 },
    { id: "prod_2jtx32PJvwMZSTc1aBIiZS", price: "$23.99", amount: 2399 },
  ),
  ...pair(
    "facebook-messenger-cleaner",
    "Messenger Cleaner",
    { id: "prod_1PHweun2mfC6stgt27CA0c", price: "$6.99", amount: 699 },
    { id: "prod_5O0iOZ0b32LKKob951ZyPY", price: "$13.99", amount: 1399 },
  ),
  ...pair(
    "mass-unfriender",
    "Mass Friends Remover for Facebook",
    { id: "prod_401pxwuk3etX3DP1HZlKUk", price: "$8.99", amount: 899 },
    { id: "prod_6vbwlTM2PYpUHZrQIU82UO", price: "$17.99", amount: 1799 },
  ),
  ...pair(
    "instagram-dm-cleaner",
    "DM Cleaner for Instagram",
    { id: "prod_TcoEXWgB1dSKpDpvR2xlR", price: "$7.99", amount: 799 },
    { id: "prod_73qz2TBHlZq0WgXMeXwghO", price: "$15.99", amount: 1599 },
  ),
  ...pair(
    "instagram-followers-tracker",
    "Followers Tracker for Instagram",
    { id: "prod_6SrWv2RAYDHkhNzC6Rj54Y", price: "$8.99", amount: 899 },
    { id: "prod_7K6szTFWny7RhRp7is9E4G", price: "$17.99", amount: 1799 },
  ),
  ...pair(
    "reddit-cleaner",
    "Reddit Cleaner",
    { id: "prod_3lhfchU5U9fCTpWF41f6wE", price: "$9.99", amount: 999 },
    { id: "prod_1tFqW610Jkko8inVbzFk1B", price: "$19.99", amount: 1999 },
  ),
  ...pair(
    "cleanerx",
    "CleanerX for X (Twitter)",
    { id: "prod_3CEocqawHcIafYKjX5OLvm", price: "$9.99", amount: 999 },
    { id: "prod_51wWQRUjgNzr9hm38p77if", price: "$19.99", amount: 1999 },
  ),
  ...pair(
    "facebook-activity-cleaner",
    "Facebook Activity Log Cleaner",
    { id: "prod_5fiWvfJ6gEgzBo9BKIs3Bh", price: "$9.99", amount: 999 },
    { id: "prod_18fsp4H65B72bLXfaJ3Xk5", price: "$19.99", amount: 1999 },
  ),

  // ---------------------------------------------------------------- retired
  // Never sold again. They stay here so old webhooks, refunds, disputes and
  // existing licences keep resolving to the right entitlements.
  {
    id: "prod_4V4Cn1vSweOEHUelKDyGYv",
    name: "CleanMySocial — All 5 Tools Lifetime",
    price: "$30.00",
    amount: 3000,
    kind: "bundle",
    billingType: "onetime",
    billingPeriod: "once",
    access: "lifetime",
    slug: "all-tools",
    entitlements: BUNDLE_ENTITLEMENTS,
    blurb: "Every tool we make, unlocked for life.",
    compareAt: "$45.00",
    retired: true,
  },
  {
    id: "prod_4nkm9mqa5JmOIiB4CRiPBI",
    name: "DM Cleaner for Instagram — Lifetime Access",
    price: "$8.00",
    amount: 800,
    kind: "single",
    billingType: "onetime",
    billingPeriod: "once",
    access: "lifetime",
    entitlements: ["instagram-dm-cleaner"],
    blurb: "Bulk-unsend the Instagram messages you sent, unlocked for life.",
    retired: true,
  },
  {
    id: "prod_LkRp16Zsyb8CFn6datwp9",
    name: "Followers Tracker for Instagram — Pro Lifetime",
    price: "$9.00",
    amount: 900,
    kind: "single",
    billingType: "onetime",
    billingPeriod: "once",
    access: "lifetime",
    entitlements: ["instagram-followers-tracker"],
    blurb: "All Followers Tracker Pro features for life.",
    retired: true,
  },
  {
    // Retired when Followers Tracker moved to a single $9 lifetime plan. Keep
    // it resolvable for existing subscriptions and lifecycle webhooks.
    id: "prod_7VBG2LHtYT1VyuwIeBHZXB",
    name: "Followers Tracker for Instagram — Pro Monthly (legacy)",
    price: "$9.00",
    amount: 900,
    kind: "single",
    billingType: "recurring",
    billingPeriod: "every-month",
    access: "subscription",
    entitlements: ["instagram-followers-tracker"],
    retired: true,
  },
  {
    // Replaced by the $9 lifetime product. Keep it resolvable for historic
    // purchases, refunds, disputes, and delayed webhook delivery.
    id: "prod_2o5aMEKHffGlBdOdo53QCe",
    name: "Followers Tracker for Instagram — Pro Lifetime ($21 legacy)",
    price: "$21.00",
    amount: 2100,
    kind: "single",
    billingType: "onetime",
    billingPeriod: "once",
    access: "lifetime",
    entitlements: ["instagram-followers-tracker"],
    retired: true,
  },
  {
    id: "prod_4cmh6GLi9ojuAYwIEK5g7o",
    name: "Delete All Messages for Facebook & Instagram",
    price: "$12.00",
    amount: 1200,
    kind: "single",
    billingType: "onetime",
    billingPeriod: "once",
    access: "lifetime",
    entitlements: ["facebook-instagram-cleaner"],
    retired: true,
  },
  {
    id: "prod_1AIDwQ8BR1EHF88RJuXulF",
    name: "Mass Friends Remover for Facebook — Bulk Unfriender",
    price: "$9.00",
    amount: 900,
    kind: "single",
    billingType: "onetime",
    billingPeriod: "once",
    access: "lifetime",
    entitlements: ["mass-unfriender"],
    retired: true,
  },
  {
    id: "prod_mqOgQ99nw2rX1kSf1L0XX",
    name: "Messenger Cleaner — Delete All Facebook Messages",
    price: "$7.00",
    amount: 700,
    kind: "single",
    billingType: "onetime",
    billingPeriod: "once",
    access: "lifetime",
    entitlements: ["facebook-messenger-cleaner"],
    retired: true,
  },
  {
    id: "prod_5v6pn66kFfU9iU44T3rm3I",
    name: "Clean My Facebook",
    price: "$14.00",
    amount: 1400,
    kind: "combo",
    billingType: "onetime",
    billingPeriod: "once",
    access: "lifetime",
    slug: "clean-my-facebook",
    entitlements: ["facebook-messenger-cleaner", "mass-unfriender"],
    blurb: "Empty the Messenger inbox and trim the friends list in one session.",
    compareAt: "$16.00",
    retired: true,
  },
  {
    id: "prod_4CAYl1zeRYkdKPsSfS7W9j",
    name: "Clean My Messages",
    price: "$16.00",
    amount: 1600,
    kind: "combo",
    billingType: "onetime",
    billingPeriod: "once",
    access: "lifetime",
    slug: "clean-my-messages",
    entitlements: ["facebook-instagram-cleaner", "facebook-messenger-cleaner"],
    blurb: "Every message everywhere — Messenger and Instagram DMs.",
    compareAt: "$19.00",
    retired: true,
  },
  {
    // The original $8 lifetime. Never sold again, but old webhooks, refunds and
    // disputes still reference it, so it must stay resolvable.
    id: "prod_4tUdIIAOSGXJAxFUapCPdh",
    name: "CleanMySocial Lifetime (legacy)",
    price: "$8.00",
    amount: 800,
    kind: "bundle",
    billingType: "onetime",
    billingPeriod: "once",
    access: "lifetime",
    entitlements: BUNDLE_ENTITLEMENTS,
    retired: true,
  },
  {
    // Replaced by the $30 bundle. Keep it resolvable for existing purchases,
    // refunds, disputes, and delayed webhook delivery.
    id: "prod_4ubelL19379mVaGmYhhibs",
    name: "CleanMySocial — All 5 Tools ($19 legacy)",
    price: "$19.00",
    amount: 1900,
    kind: "bundle",
    billingType: "onetime",
    billingPeriod: "once",
    access: "lifetime",
    entitlements: BUNDLE_ENTITLEMENTS,
    retired: true,
  },
];

/** Emergency rollback switch. Keep false for the current monthly + lifetime
 * catalogue. Setting it to true restores the five original lifetime products;
 * the three newer extensions retain their current paired plans. */
export const LIFETIME_ONLY = false;

/**
 * The products that were on sale before monthly plans existed.
 *
 * Their entries below still carry `retired: true` — that flag records that the
 * *pricing change* retired them. While LIFETIME_ONLY is set, this list is what
 * puts them back on sale, so isBuyable (not the flag) is the authority on what
 * checkout accepts.
 */
const ORIGINAL_LIFETIME_IDS = new Set([
  "prod_4cmh6GLi9ojuAYwIEK5g7o", // Facebook & Instagram Cleaner — $12
  "prod_mqOgQ99nw2rX1kSf1L0XX", // Messenger Cleaner — $7
  "prod_1AIDwQ8BR1EHF88RJuXulF", // Mass Friends Remover — $9
  "prod_4nkm9mqa5JmOIiB4CRiPBI", // DM Cleaner — $8
  "prod_LkRp16Zsyb8CFn6datwp9", // Followers Tracker Pro — $9
]);

/**
 * Extensions released after the original catalogue have no old pricing to roll
 * back to, so they keep both new plans — monthly and lifetime — and get the
 * plan picker. The original five sell their single old lifetime product.
 */
const ROLLBACK_NEW_SLUGS: PremiumSlug[] = [
  "reddit-cleaner",
  "cleanerx",
  "facebook-activity-cleaner",
];

/**
 * What the site currently offers. Placeholder ids can never appear here, so a
 * product with no real Creem id is never shown with a buy button.
 */
export const SELLABLE = PRODUCTS.filter((product) => {
  if (product.id.startsWith(PLACEHOLDER_PREFIX)) return false;
  if (!LIFETIME_ONLY) return !product.retired;
  if (ORIGINAL_LIFETIME_IDS.has(product.id)) return true;
  return (
    !product.retired &&
    product.entitlements.some((slug) => ROLLBACK_NEW_SLUGS.includes(slug))
  );
});
export const SINGLES = SELLABLE;

/** Checkout accepts exactly what the site offers — nothing else. */
export function isBuyable(product: Product | undefined): boolean {
  return Boolean(product && SELLABLE.some((sellable) => sellable.id === product.id));
}

/** Retired bundles that old licences still reference. */
export const RETIRED_PACKAGES = PRODUCTS.filter(
  (product) => product.retired && (product.kind === "bundle" || product.kind === "combo"),
);

export function getSingleFor(slug: PremiumSlug): Product | undefined {
  return SINGLES.find((product) => product.entitlements.includes(slug));
}

export function getSinglesFor(slug: PremiumSlug): Product[] {
  return SINGLES.filter((product) => product.entitlements.includes(slug)).sort(
    (a, b) => Number(b.billingType === "recurring") - Number(a.billingType === "recurring"),
  );
}

export function getMonthlyFor(slug: PremiumSlug): Product | undefined {
  return SINGLES.find(
    (product) => product.entitlements.includes(slug) && product.billingType === "recurring",
  );
}

export function getLifetimeFor(slug: PremiumSlug): Product | undefined {
  return SINGLES.find(
    (product) => product.entitlements.includes(slug) && product.billingType === "onetime",
  );
}

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** Union of two entitlement sets — buying a second product adds to the first. */
export function mergeEntitlements(
  a: readonly string[] | undefined,
  b: readonly string[],
): PremiumSlug[] {
  const set = new Set<string>([...(a || []), ...b]);
  return ALL_PREMIUM_SLUGS.filter((slug) => set.has(slug));
}
