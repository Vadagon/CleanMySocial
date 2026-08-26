// Every sellable Creem product, and exactly which extensions it unlocks.
//
// Each paid extension is sold on its own with a 3-day pass, monthly access, or
// lifetime access. Bundles, combos, and superseded prices stay in PRODUCTS only
// so existing licences and historical Creem events keep resolving.

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
export type ProductAccess = "pass" | "subscription" | "lifetime";

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
  /** Fixed access window for a one-time pass. Omitted for monthly/lifetime. */
  durationDays?: number;
  /** public detail page slug, retired packages only */
  slug?: string;
  entitlements: PremiumSlug[];
  /** shown on the pricing page */
  blurb?: string;
  /** struck-through comparison price for legacy cards or promotional offers */
  compareAt?: string;
  /** Private offer shown only through an explicit campaign entry point. */
  promotion?: "uninstall_50";
  /** retired products stay resolvable for old customers but are never sold */
  retired?: boolean;
}

/**
 * Every extension is sold three ways: a one-time 3-day pass, a monthly
 * subscription, or a one-time lifetime licence. There are no bundles or
 * combos — retired products below remain resolvable for existing customers.
 *
 * Creem ids are created by scripts/create-creem-products.mjs, which writes the
 * real ids back into this file. A PLACEHOLDER id is never sellable.
 */
export const PLACEHOLDER_PREFIX = "prod_PLACEHOLDER_";
export const PRICING_VARIANT = "hot_v1";
export const UNINSTALL_DISCOUNT_VARIANT = "uninstall_50_v1";

export function pricingVariantFor(product: Product): string {
  return product.promotion === "uninstall_50"
    ? UNINSTALL_DISCOUNT_VARIANT
    : PRICING_VARIANT;
}

function trio(
  slug: PremiumSlug,
  name: string,
  hot: { id: string; price: string; amount: number },
  monthly: { id: string; price: string; amount: number },
  lifetime: { id: string; price: string; amount: number },
): Product[] {
  return [
    {
      id: hot.id,
      name: `${name} — 3-Day Pass`,
      price: hot.price,
      amount: hot.amount,
      kind: "single",
      billingType: "onetime",
      billingPeriod: "once",
      access: "pass",
      durationDays: 3,
      entitlements: [slug],
    },
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

function discountPass(
  slug: PremiumSlug,
  name: string,
  offer: { id: string; price: string; amount: number; compareAt: string },
): Product {
  return {
    id: offer.id,
    name: `${name} — 3-Day Pass (Uninstall Offer, 50% Off)`,
    price: offer.price,
    amount: offer.amount,
    compareAt: offer.compareAt,
    kind: "single",
    billingType: "onetime",
    billingPeriod: "once",
    access: "pass",
    durationDays: 3,
    entitlements: [slug],
    promotion: "uninstall_50",
  };
}

export const PRODUCTS: Product[] = [
  ...trio(
    "facebook-instagram-cleaner",
    "Delete All Messages for Facebook & Instagram",
    { id: "prod_2SbpZbA8IpnbJqO4egVQ1s", price: "$5.99", amount: 599 },
    { id: "prod_7etiEEcsvj1BBHR4mMzkrA", price: "$11.99", amount: 1199 },
    { id: "prod_6nYuAhwSyiXUdJMHTr6yEP", price: "$34.99", amount: 3499 },
  ),
  ...trio(
    "facebook-messenger-cleaner",
    "Messenger Cleaner",
    { id: "prod_3wC56XjdwXWx2mJa9T1TJ4", price: "$3.99", amount: 399 },
    { id: "prod_1PHweun2mfC6stgt27CA0c", price: "$6.99", amount: 699 },
    { id: "prod_6ck4bPbBsZyZGgxBBtUI6E", price: "$19.99", amount: 1999 },
  ),
  ...trio(
    "mass-unfriender",
    "Mass Friends Remover for Facebook",
    { id: "prod_6FfJyvCLoZfYN2lgqEfSH6", price: "$4.99", amount: 499 },
    { id: "prod_401pxwuk3etX3DP1HZlKUk", price: "$8.99", amount: 899 },
    { id: "prod_3ZikkTdzqjuEqFgBdwRBId", price: "$27.99", amount: 2799 },
  ),
  ...trio(
    "instagram-dm-cleaner",
    "DM Cleaner for Instagram",
    { id: "prod_5lIctLICJusZtaN1nUTAS3", price: "$4.99", amount: 499 },
    { id: "prod_TcoEXWgB1dSKpDpvR2xlR", price: "$7.99", amount: 799 },
    { id: "prod_58A60RauiaLPBD68eyt17Y", price: "$24.99", amount: 2499 },
  ),
  ...trio(
    "instagram-followers-tracker",
    "Followers Tracker for Instagram",
    { id: "prod_4buhgPxCuMmk3ZlF12xH5d", price: "$4.99", amount: 499 },
    { id: "prod_6SrWv2RAYDHkhNzC6Rj54Y", price: "$8.99", amount: 899 },
    { id: "prod_43WRMMuiBcHCcgkp7y7dGv", price: "$29.99", amount: 2999 },
  ),
  ...trio(
    "reddit-cleaner",
    "Reddit Cleaner",
    { id: "prod_766VwBnBJIEbkxwVRb0K5r", price: "$4.99", amount: 499 },
    { id: "prod_3lhfchU5U9fCTpWF41f6wE", price: "$9.99", amount: 999 },
    { id: "prod_3p8vvweDbQaRlFOQDZtKXK", price: "$29.99", amount: 2999 },
  ),
  ...trio(
    "cleanerx",
    "CleanerX for X (Twitter)",
    { id: "prod_4yjtyHOlF2WpRMrhGpDB9N", price: "$4.99", amount: 499 },
    { id: "prod_3CEocqawHcIafYKjX5OLvm", price: "$9.99", amount: 999 },
    { id: "prod_6lo2yB8XuVGmzkITvWLRqw", price: "$29.99", amount: 2999 },
  ),
  ...trio(
    "facebook-activity-cleaner",
    "Facebook Activity Log Cleaner",
    { id: "prod_23F7t0estgykA0NvzI2xoM", price: "$4.99", amount: 499 },
    { id: "prod_5fiWvfJ6gEgzBo9BKIs3Bh", price: "$9.99", amount: 999 },
    { id: "prod_4fZEM7TxUQ9lDhzeTR1hVn", price: "$29.99", amount: 2999 },
  ),

  // Private uninstall win-back offers. Odd-cent prices are rounded down, so
  // every offer is at least 50% below the public 3-day price.
  discountPass(
    "facebook-instagram-cleaner",
    "Delete All Messages for Facebook & Instagram",
    { id: "prod_2JwtqD8iOjJfM6sT2FKKkL", price: "$2.99", amount: 299, compareAt: "$5.99" },
  ),
  discountPass(
    "facebook-messenger-cleaner",
    "Messenger Cleaner",
    { id: "prod_7NCiHDobbDj3YBoWSQLilo", price: "$1.99", amount: 199, compareAt: "$3.99" },
  ),
  discountPass(
    "mass-unfriender",
    "Mass Friends Remover for Facebook",
    { id: "prod_1H0umVz4eAepFVaVF48Ada", price: "$2.49", amount: 249, compareAt: "$4.99" },
  ),
  discountPass(
    "instagram-dm-cleaner",
    "DM Cleaner for Instagram",
    { id: "prod_2F5oklF3bWTFBimGWtWFfk", price: "$2.49", amount: 249, compareAt: "$4.99" },
  ),
  discountPass(
    "instagram-followers-tracker",
    "Followers Tracker for Instagram",
    { id: "prod_5vQ0Mitq9W6RwIKAgmsAui", price: "$2.49", amount: 249, compareAt: "$4.99" },
  ),
  discountPass(
    "reddit-cleaner",
    "Reddit Cleaner",
    { id: "prod_4j2fulE0Xd8j9rU9ystHg1", price: "$2.49", amount: 249, compareAt: "$4.99" },
  ),
  discountPass(
    "cleanerx",
    "CleanerX for X (Twitter)",
    { id: "prod_5eDPOZlfM3UQJAtuI1dmXY", price: "$2.49", amount: 249, compareAt: "$4.99" },
  ),
  discountPass(
    "facebook-activity-cleaner",
    "Facebook Activity Log Cleaner",
    { id: "prod_3wWojczgspFC0sfpmC7qW6", price: "$2.49", amount: 249, compareAt: "$4.99" },
  ),

  // ---------------------------------------------------------------- retired
  // Never sold again. They stay here so old webhooks, refunds, disputes and
  // existing licences keep resolving to the right entitlements.
  ...[
    ["prod_2jtx32PJvwMZSTc1aBIiZS", "Delete All Messages for Facebook & Instagram", "$23.99", 2399, "facebook-instagram-cleaner"],
    ["prod_5O0iOZ0b32LKKob951ZyPY", "Messenger Cleaner", "$13.99", 1399, "facebook-messenger-cleaner"],
    ["prod_6vbwlTM2PYpUHZrQIU82UO", "Mass Friends Remover for Facebook", "$17.99", 1799, "mass-unfriender"],
    ["prod_73qz2TBHlZq0WgXMeXwghO", "DM Cleaner for Instagram", "$15.99", 1599, "instagram-dm-cleaner"],
    ["prod_7K6szTFWny7RhRp7is9E4G", "Followers Tracker for Instagram", "$17.99", 1799, "instagram-followers-tracker"],
    ["prod_1tFqW610Jkko8inVbzFk1B", "Reddit Cleaner", "$19.99", 1999, "reddit-cleaner"],
    ["prod_51wWQRUjgNzr9hm38p77if", "CleanerX for X (Twitter)", "$19.99", 1999, "cleanerx"],
    ["prod_18fsp4H65B72bLXfaJ3Xk5", "Facebook Activity Log Cleaner", "$19.99", 1999, "facebook-activity-cleaner"],
  ].map(([id, name, price, amount, slug]) => ({
    id: id as string,
    name: `${name as string} — Lifetime (legacy price)`,
    price: price as string,
    amount: amount as number,
    kind: "single" as const,
    billingType: "onetime" as const,
    billingPeriod: "once" as const,
    access: "lifetime" as const,
    entitlements: [slug as PremiumSlug],
    retired: true,
  })),
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

/** Emergency rollback switch. Keep false for the current three-plan
 * catalogue. Setting it to true restores the five original lifetime products;
 * the three newer extensions retain their current plans. */
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
  if (product.promotion) return false;
  if (!LIFETIME_ONLY) return !product.retired;
  if (ORIGINAL_LIFETIME_IDS.has(product.id)) return true;
  return (
    !product.retired &&
    product.entitlements.some((slug) => ROLLBACK_NEW_SLUGS.includes(slug))
  );
});
export const SINGLES = SELLABLE;

/** Campaign-only products never shown in the public plan catalogue. */
export const PROMOTIONAL = PRODUCTS.filter(
  (product) =>
    !LIFETIME_ONLY &&
    !product.retired &&
    Boolean(product.promotion) &&
    !product.id.startsWith(PLACEHOLDER_PREFIX),
);

/** Checkout accepts the public catalogue plus explicit campaign products. */
export function isBuyable(product: Product | undefined): boolean {
  return Boolean(product && [...SELLABLE, ...PROMOTIONAL].some((sellable) => sellable.id === product.id));
}

/** Retired bundles that old licences still reference. */
export const RETIRED_PACKAGES = PRODUCTS.filter(
  (product) => product.retired && (product.kind === "bundle" || product.kind === "combo"),
);

export function getSingleFor(slug: PremiumSlug): Product | undefined {
  return SINGLES.find((product) => product.entitlements.includes(slug));
}

export function getSinglesFor(slug: PremiumSlug): Product[] {
  const order: Record<ProductAccess, number> = { pass: 0, subscription: 1, lifetime: 2 };
  return SINGLES.filter((product) => product.entitlements.includes(slug)).sort(
    (a, b) => order[a.access] - order[b.access],
  );
}

export function getPassFor(slug: PremiumSlug): Product | undefined {
  return SINGLES.find(
    (product) => product.entitlements.includes(slug) && product.access === "pass",
  );
}

export function getDiscountPassFor(slug: PremiumSlug): Product | undefined {
  return PROMOTIONAL.find(
    (product) => product.entitlements.includes(slug) && product.promotion === "uninstall_50",
  );
}

export function getMonthlyFor(slug: PremiumSlug): Product | undefined {
  return SINGLES.find(
    (product) => product.entitlements.includes(slug) && product.billingType === "recurring",
  );
}

export function getLifetimeFor(slug: PremiumSlug): Product | undefined {
  return SINGLES.find(
    (product) => product.entitlements.includes(slug) && product.access === "lifetime",
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
