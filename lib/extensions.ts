import { BUNDLE_PRODUCT, getSinglesFor } from "./products";
import type { PremiumSlug, Product } from "./products";

export type Access = "lifetime" | "subscription";

export interface Plan {
  plan: string;
  label: string;
  productId: string;
  price: string;
  cadence: string;
  access: Access;
  recurring: boolean;
  highlight?: boolean;
  description?: string;
  compareAt?: string;
  badge?: string;
}

export interface Extension {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  storeId: string;
  storeUrl: string;
  licenseGroup: "cleanmysocial";
  plans: Plan[];
  /**
   * Chrome Web Store rating, entered by hand — the store has no public API and
   * scraping it would break silently. Fill BOTH `rating` and `reviews` from the
   * live listing, set `ratingsUpdated` to that date, and never estimate: a made
   * up review count is false advertising and grounds for listing removal.
   * Leave undefined and nothing is shown.
   */
  rating?: number;
  reviews?: number;
  ratingsUpdated?: string;
  /** Set on genuinely new listings to say so instead of showing nothing. */
  newRelease?: boolean;
  /** Files under /public/screenshots/<slug>/ — shown on the detail page. */
  screenshots?: { src: string; alt: string }[];
}

/** Below this, a rating is too thin to persuade anyone — say "new" instead. */
export const MIN_REVIEWS_TO_SHOW = 5;

export function hasUsableRating(ext: Extension): boolean {
  return (
    typeof ext.rating === "number" &&
    typeof ext.reviews === "number" &&
    ext.reviews >= MIN_REVIEWS_TO_SHOW
  );
}

export function groupOf(_ext: Extension): string {
  return "cleanmysocial";
}

export const BUNDLE_PLAN: Plan = {
  plan: "lifetime",
  label: "All 4 CleanMySocial tools",
  productId: BUNDLE_PRODUCT.id,
  price: BUNDLE_PRODUCT.price,
  cadence: "one-time payment · lifetime access",
  access: "lifetime",
  recurring: false,
  highlight: true,
  description: "Every CleanMySocial extension in one lifetime package.",
  compareAt: BUNDLE_PRODUCT.compareAt,
  badge: "Best overall value",
};

export function planForProduct(product: Product): Plan {
  const recurring = product.billingType === "recurring";
  const trackerPlan =
    product.kind === "single" && product.entitlements.includes("instagram-followers-tracker");
  return {
    plan:
      product.billingPeriod === "every-month"
        ? "monthly"
        : product.entitlements.includes("instagram-followers-tracker") && product.kind === "single"
          ? "lifetime"
          : product.id,
    label: trackerPlan ? (recurring ? "Pro Monthly" : "Pro Lifetime") : product.name,
    productId: product.id,
    price: product.price,
    cadence: recurring ? "billed monthly" : "one-time payment · lifetime access",
    access: product.access,
    recurring,
    highlight: product.kind === "bundle" || product.access === "lifetime",
    description: product.blurb,
    compareAt: product.compareAt,
    badge:
      product.kind === "combo"
        ? "Two-tool discount"
        : product.kind === "bundle"
          ? "Best overall value"
          : undefined,
  };
}

function singlePlan(slug: PremiumSlug): Plan[] {
  return getSinglesFor(slug).map(planForProduct);
}

export const EXTENSIONS: Extension[] = [
  {
    slug: "facebook-instagram-cleaner",
    name: "Delete All Messages for Facebook & Instagram",
    tagline: "Clean Messenger conversations and Instagram DMs from one side panel.",
    description:
      "Bulk delete, archive, or restore Facebook Messenger conversations, then scan an Instagram conversation and unsend messages sent by your account.",
    icon: "/extensions/facebook-instagram-cleaner.png",
    rating: 4.0,
    reviews: 383,
    ratingsUpdated: "August 7, 2026",
    screenshots: [
      { src: "/screenshots/facebook-instagram-cleaner/screen1.jpg", alt: "Bulk deleting Messenger conversations from the side panel" },
    ],
    storeId: "cboolboidgkagffpalhlojepcghkkfej",
    storeUrl:
      "https://chromewebstore.google.com/detail/cboolboidgkagffpalhlojepcghkkfej",
    licenseGroup: "cleanmysocial",
    plans: singlePlan("facebook-instagram-cleaner"),
  },
  {
    slug: "facebook-messenger-cleaner",
    name: "Messenger Cleaner – Delete All Facebook Messages",
    tagline: "Delete, archive, or restore Messenger conversations in bulk.",
    description:
      "Clean up your Facebook Messenger inbox from a persistent Chrome side panel instead of handling conversations one at a time.",
    icon: "/extensions/facebook-messenger-cleaner.png",
    rating: 3.1,
    reviews: 93,
    ratingsUpdated: "August 7, 2026",
    screenshots: [
      { src: "/screenshots/facebook-messenger-cleaner/screen1.png", alt: "Selecting Messenger conversations to delete or archive" },
    ],
    storeId: "imobgpikmofiapbnijmebknbkmkncdkl",
    storeUrl:
      "https://chromewebstore.google.com/detail/imobgpikmofiapbnijmebknbkmkncdkl",
    licenseGroup: "cleanmysocial",
    plans: singlePlan("facebook-messenger-cleaner"),
  },
  {
    slug: "mass-unfriender",
    name: "Mass Friends Remover for Facebook — Bulk Unfriender",
    tagline: "Select and unfriend multiple Facebook friends from one screen.",
    description:
      "Review, select, and remove friends from your own Facebook account in bulk instead of visiting profiles one by one.",
    icon: "/extensions/mass-unfriender.png",
    rating: 4.0,
    reviews: 168,
    ratingsUpdated: "August 7, 2026",
    screenshots: [
      { src: "/screenshots/mass-unfriender/screen1.jpg", alt: "Reviewing and selecting Facebook friends to remove" },
    ],
    storeId: "fegkbiinmaoipoonnlhekdoefgebmdnj",
    storeUrl:
      "https://chromewebstore.google.com/detail/fegkbiinmaoipoonnlhekdoefgebmdnj",
    licenseGroup: "cleanmysocial",
    plans: singlePlan("mass-unfriender"),
  },
  {
    slug: "instagram-followers-tracker",
    name: "Followers Tracker for Instagram – Unfollowers & Bulk Unfollow",
    tagline:
      "See who unfollowed you, get automatic daily alerts, bulk unfollow non-followers, and export your lists.",
    description:
      "Manual scans, unfollower history, and one-by-one unfollows are free. Pro adds an automatic daily scan with desktop unfollower notifications, safe bulk unfollow, and one-click CSV or Excel exports. Your follower data stays locally in your browser.",
    icon: "/extensions/instagram-followers-tracker.png",
    rating: 5.0,
    reviews: 3,
    ratingsUpdated: "August 10, 2026",
    screenshots: [
      { src: "/screenshots/instagram-followers-tracker/screen1.png", alt: "The followers table with per-account actions" },
    ],
    storeId: "kfaklckklmlknieiniakbekofgndfpbp",
    storeUrl:
      "https://chromewebstore.google.com/detail/kfaklckklmlknieiniakbekofgndfpbp",
    licenseGroup: "cleanmysocial",
    plans: singlePlan("instagram-followers-tracker"),
  },
];

export const PREMIUM_EXTENSIONS = EXTENSIONS.filter(
  (extension) => extension.plans.length > 0,
);

export const FREE_EXTENSIONS = EXTENSIONS.filter(
  (extension) => extension.plans.length === 0,
);

const EXTENSION_ALIASES: Record<string, string> = {
  "messenger-cleaner": "facebook-instagram-cleaner",
  "mass-friends-remover": "mass-unfriender",
  "followers-tracker": "instagram-followers-tracker",
  "ig-followers-tracker": "instagram-followers-tracker",
};

export const EXTENSION_STATIC_SLUGS = [
  ...EXTENSIONS.map((extension) => extension.slug),
  ...Object.keys(EXTENSION_ALIASES),
];

export function getExtension(slug: string): Extension | undefined {
  const canonicalSlug = EXTENSION_ALIASES[slug] || slug;
  return EXTENSIONS.find((extension) => extension.slug === canonicalSlug);
}

export function getPlan(slug: string, plan: string): Plan | undefined {
  return getExtension(slug)?.plans.find((item) => item.plan === plan);
}
