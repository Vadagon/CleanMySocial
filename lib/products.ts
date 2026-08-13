// Every sellable Creem product, and exactly which extensions it unlocks.
//
// The bundle grants all premium slugs, so adding a premium extension later means
// adding its slug to BUNDLE_ENTITLEMENTS and to the combos that should include
// it — nothing else derives entitlements.

/** Slugs that can be entitled. Must match Extension.slug in extensions.ts. */
export type PremiumSlug =
  | "facebook-instagram-cleaner"
  | "facebook-messenger-cleaner"
  | "mass-unfriender"
  | "instagram-followers-tracker";

export const BUNDLE_ENTITLEMENTS: PremiumSlug[] = [
  "facebook-instagram-cleaner",
  "facebook-messenger-cleaner",
  "mass-unfriender",
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
  /** display price, e.g. "$12.00" */
  price: string;
  /** cents, for analytics */
  amount: number;
  kind: ProductKind;
  billingType: BillingType;
  billingPeriod: BillingPeriod;
  access: ProductAccess;
  /** public detail page slug for combos and bundles */
  slug?: string;
  entitlements: PremiumSlug[];
  /** shown on the pricing page */
  blurb?: string;
  /** struck-through comparison for combos */
  compareAt?: string;
  /** retired products stay resolvable for old customers but are never sold */
  retired?: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: "prod_4V4Cn1vSweOEHUelKDyGYv",
    name: "CleanMySocial — All 4 Tools Lifetime",
    price: "$30.00",
    amount: 3000,
    kind: "bundle",
    billingType: "onetime",
    billingPeriod: "once",
    access: "lifetime",
    slug: "all-tools",
    entitlements: BUNDLE_ENTITLEMENTS,
    blurb: "Every tool we make, unlocked for life.",
    compareAt: "$49.00",
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
    name: "CleanMySocial — All 4 Tools ($19 legacy)",
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

/** The bundle we currently sell. Never a retired product: an override that
 *  names one (CREEM_BUNDLE_PRODUCT_ID still pointed at the $8 product long
 *  after it was retired) would otherwise put an unbuyable id behind Buy now,
 *  and checkout rejects retired products — breaking every purchase. */
export const BUNDLE_PRODUCT: Product = (() => {
  const override = process.env.CREEM_BUNDLE_PRODUCT_ID
    ? PRODUCTS.find((p) => p.id === process.env.CREEM_BUNDLE_PRODUCT_ID && !p.retired)
    : undefined;
  const fallback = PRODUCTS.find((p) => p.kind === "bundle" && !p.retired);
  if (process.env.CREEM_BUNDLE_PRODUCT_ID && !override) {
    console.warn(
      "[products] CREEM_BUNDLE_PRODUCT_ID names an unknown or retired product; using",
      fallback?.id,
    );
  }
  return override || fallback || PRODUCTS[0];
})();

export const SELLABLE = PRODUCTS.filter((p) => !p.retired);
export const SINGLES = SELLABLE.filter((p) => p.kind === "single");
export const COMBOS = SELLABLE.filter((p) => p.kind === "combo");
export const PACKAGES = SELLABLE.filter(
  (product) => (product.kind === "combo" || product.kind === "bundle") && product.slug,
);

export function getSingleFor(slug: PremiumSlug): Product | undefined {
  return SINGLES.find((product) => product.entitlements.includes(slug));
}

export function getSinglesFor(slug: PremiumSlug): Product[] {
  return SINGLES.filter((product) => product.entitlements.includes(slug));
}

export function getCombosFor(slug: PremiumSlug): Product[] {
  return COMBOS.filter((product) => product.entitlements.includes(slug));
}

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getPackageBySlug(slug: string): Product | undefined {
  return PACKAGES.find((product) => product.slug === slug);
}

/** Union of two entitlement sets — buying a second product adds to the first. */
export function mergeEntitlements(
  a: readonly string[] | undefined,
  b: readonly string[],
): PremiumSlug[] {
  const set = new Set<string>([...(a || []), ...b]);
  return BUNDLE_ENTITLEMENTS.filter((slug) => set.has(slug));
}
