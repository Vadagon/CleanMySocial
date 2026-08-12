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

export interface FreePlan {
  allowance: string;
  headline: string;
  upgradeMessage: string;
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
  freePlan: FreePlan;
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
  /** Short name for headings, where the full store title is unwieldy. */
  shortName: string;
  /** Files under /public/screenshots/<slug>/ — shown on the detail page. */
  screenshots?: { src: string; alt: string }[];
  /**
   * Headings for the four product-detail sections.
   *
   * These are search copy, not labels. Someone arrives having typed "how to
   * unfriend multiple people on facebook at once", so the heading above the
   * steps should say that back to them rather than "How it works". Write them
   * in the words a person searches with, and keep them true to the section
   * underneath. Falls back to generic wording when omitted.
   */
  detailHeadings?: {
    features: string;
    steps: string;
    limitations: string;
    faq: string;
  };
  features: string[];
  steps: string[];
  limitations: string[];
  faq: { question: string; answer: string }[];
}

/** Generic wording for an extension with no `detailHeadings` of its own. */
export function detailHeadingsFor(ext: Extension) {
  return (
    ext.detailHeadings ?? {
      features: `What ${ext.name} does`,
      steps: "How it works",
      limitations: "Limits and important notes",
      faq: "Frequently asked questions",
    }
  );
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
    detailHeadings: {
      features: "Bulk delete Facebook and Instagram messages",
      steps: "How to delete Facebook and Instagram messages in bulk",
      limitations: "What it cannot delete",
      faq: "Facebook and Instagram message deletion FAQ",
    },
    shortName: "Facebook & Instagram Cleaner",
    name: "Delete All Messages for Facebook & Instagram",
    tagline: "Clean Messenger conversations and Instagram DMs from one side panel.",
    description:
      "Bulk delete, archive, or restore Facebook Messenger conversations, then scan an Instagram conversation and unsend messages sent by your account.",
    icon: "/extensions/facebook-instagram-cleaner.png",
    rating: 4.0,
    reviews: 383,
    ratingsUpdated: "August 7, 2026",
    screenshots: [
      { src: "/screenshots/facebook-instagram-cleaner/screen1.webp", alt: "CleanMySocial side panel for selecting Facebook Messenger conversations to delete, archive, or restore" },
    ],
    features: [
      "Delete, archive, or restore multiple Facebook Messenger conversations",
      "Scan an Instagram conversation and unsend messages sent by your account",
      "Choose the action yourself from a Chrome side panel",
      "Works inside your existing Facebook or Instagram browser session",
    ],
    steps: [
      "Install the extension from the Chrome Web Store.",
      "Open Facebook Messenger or the Instagram conversation you want to manage.",
      "Open the side panel, review the available action, and start the cleanup.",
    ],
    limitations: [
      "Deleting a Messenger conversation removes your copy; it does not erase the other participant's copy.",
      "Instagram unsend applies only to messages sent by your own account.",
      "Facebook and Instagram interface changes can temporarily affect browser automation.",
    ],
    faq: [
      { question: "Can I use Delete All Messages for Facebook & Instagram for free?", answer: "Yes. The free plan includes 10 cleanup actions per day. A lifetime upgrade removes the daily limit." },
      { question: "Does CleanMySocial receive my messages?", answer: "No. The extension performs the requested actions inside your signed-in browser session; CleanMySocial does not receive or store message content." },
      { question: "Can it remove Messenger messages from both people?", answer: "Deleting a conversation removes your copy only. On Instagram, the extension can unsend messages that were sent by your own account." },
      { question: "Is this affiliated with Meta?", answer: "No. CleanMySocial is an independent product and is not affiliated with or endorsed by Meta, Facebook, Instagram, Google, or Chrome." },
    ],
    storeId: "cboolboidgkagffpalhlojepcghkkfej",
    storeUrl:
      "https://chromewebstore.google.com/detail/cboolboidgkagffpalhlojepcghkkfej",
    licenseGroup: "cleanmysocial",
    freePlan: {
      allowance: "10 cleanup actions per day",
      headline: "Message cleanup is free to use",
      upgradeMessage: "Upgrade for unlimited cleanup.",
    },
    plans: singlePlan("facebook-instagram-cleaner"),
  },
  {
    slug: "facebook-messenger-cleaner",
    detailHeadings: {
      features: "Bulk delete Facebook Messenger conversations",
      steps: "How to delete all Facebook Messenger messages",
      limitations: "What deleting a Messenger conversation does not do",
      faq: "Facebook Messenger cleanup FAQ",
    },
    shortName: "Messenger Cleaner",
    name: "Messenger Cleaner – Delete All Facebook Messages",
    tagline: "Delete, archive, or restore Messenger conversations in bulk.",
    description:
      "Clean up your Facebook Messenger inbox from a persistent Chrome side panel instead of handling conversations one at a time.",
    icon: "/extensions/facebook-messenger-cleaner.png",
    rating: 3.1,
    reviews: 93,
    ratingsUpdated: "August 7, 2026",
    screenshots: [
      { src: "/screenshots/facebook-messenger-cleaner/screen1.webp", alt: "Messenger Cleaner side panel with bulk delete, archive, and restore controls" },
    ],
    features: [
      "Select multiple Messenger conversations for one cleanup run",
      "Delete, archive, or restore conversations from a persistent side panel",
      "Runs in the Facebook tab you are already signed into",
      "No separate CleanMySocial account is required",
    ],
    steps: [
      "Install Messenger Cleaner from the Chrome Web Store.",
      "Open Facebook Messenger in Chrome and open the extension side panel.",
      "Choose the conversations and cleanup action, then keep the tab open while it runs.",
    ],
    limitations: [
      "Deleting removes the conversation from your account, not from the other participant's account.",
      "The tab must remain open while a bulk action is running.",
      "Facebook interface changes can temporarily interrupt automated actions.",
    ],
    faq: [
      { question: "Can I use Messenger Cleaner for free?", answer: "Yes. The free plan includes 20 conversation actions per day. The lifetime upgrade unlocks unlimited conversation actions." },
      { question: "Does Messenger Cleaner upload my conversations?", answer: "No. Conversation cleanup runs in your browser and message contents are not sent to CleanMySocial." },
      { question: "Can I archive instead of delete?", answer: "Yes. The extension supports bulk archive as well as delete and restore actions." },
      { question: "Is this a lifetime purchase?", answer: "The currently listed Messenger Cleaner plan is a one-time purchase with lifetime access for the commercial lifetime of the product, subject to the Terms of Service." },
    ],
    storeId: "imobgpikmofiapbnijmebknbkmkncdkl",
    storeUrl:
      "https://chromewebstore.google.com/detail/imobgpikmofiapbnijmebknbkmkncdkl",
    licenseGroup: "cleanmysocial",
    freePlan: {
      allowance: "20 conversation actions per day",
      headline: "Messenger cleanup is free to use",
      upgradeMessage: "Upgrade for unlimited cleanup.",
    },
    plans: singlePlan("facebook-messenger-cleaner"),
  },
  {
    slug: "mass-unfriender",
    detailHeadings: {
      features: "Remove Facebook friends in bulk",
      steps: "How to unfriend multiple people on Facebook at once",
      limitations: "What bulk unfriending does not do",
      faq: "Facebook bulk unfriend FAQ",
    },
    shortName: "Mass Friends Remover",
    name: "Mass Friends Remover for Facebook — Bulk Unfriender",
    tagline: "Select and unfriend multiple Facebook friends from one screen.",
    description:
      "Review, select, and remove friends from your own Facebook account in bulk instead of visiting profiles one by one.",
    icon: "/extensions/mass-unfriender.png",
    rating: 4.0,
    reviews: 168,
    ratingsUpdated: "August 7, 2026",
    screenshots: [
      { src: "/screenshots/mass-unfriender/screen1.webp", alt: "Mass Friends Remover list for reviewing and selecting Facebook friends before removal" },
    ],
    features: [
      "Review Facebook friends together on one screen",
      "Select individual friends or prepare a larger removal list",
      "Remove selected friends in a paced bulk run",
      "Works with the Facebook account already signed into Chrome",
    ],
    steps: [
      "Install Mass Friends Remover from the Chrome Web Store.",
      "Open your Facebook friends list and launch the extension.",
      "Review and select the people to remove, then start the paced run.",
    ],
    limitations: [
      "You are responsible for reviewing the selection before removal.",
      "Facebook may rate-limit large or unusually fast account actions.",
      "Facebook interface changes can temporarily affect the tool.",
    ],
    faq: [
      { question: "Can I use Mass Friends Remover for free?", answer: "Yes. The free plan includes 20 friend removals per day. The lifetime upgrade unlocks unlimited friend removals." },
      { question: "Does Facebook notify someone when I unfriend them?", answer: "Facebook does not send an unfriend notification, although the person may notice later by checking your profile or friends list." },
      { question: "Does CleanMySocial receive my friends list?", answer: "No. Friend selection and removal happen in your browser; CleanMySocial does not receive the names of people you remove." },
      { question: "Can I review people before removing them?", answer: "Yes. The product is designed around selecting and reviewing the removal list before the run begins." },
    ],
    storeId: "fegkbiinmaoipoonnlhekdoefgebmdnj",
    storeUrl:
      "https://chromewebstore.google.com/detail/fegkbiinmaoipoonnlhekdoefgebmdnj",
    licenseGroup: "cleanmysocial",
    freePlan: {
      allowance: "20 friend removals per day",
      headline: "Friend cleanup is free to use",
      upgradeMessage: "Upgrade for unlimited removals.",
    },
    plans: singlePlan("mass-unfriender"),
  },
  {
    slug: "instagram-followers-tracker",
    detailHeadings: {
      features: "Track Instagram unfollowers and bulk unfollow",
      steps: "How to see who unfollowed you on Instagram",
      limitations: "What follower tracking cannot show",
      faq: "Instagram unfollowers FAQ",
    },
    shortName: "Followers Tracker",
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
      { src: "/screenshots/instagram-followers-tracker/workflow-2026.webp", alt: "Followers Tracker for Instagram workflow for choosing an account and list, reviewing non-followers, unfollowing, and downloading results" },
    ],
    features: [
      "Compare scans to identify new followers and unfollowers",
      "See accounts you follow that do not follow you back",
      "Use one-by-one unfollow for free or paced bulk unfollow with Pro",
      "Export follower data to CSV or Excel with Pro",
      "Store follower history locally in Chrome extension storage",
    ],
    steps: [
      "Install Followers Tracker and sign into Instagram in the same Chrome profile.",
      "Run the first scan to create a local baseline of your followers and following.",
      "Run later scans to see changes, or enable Pro daily scans and alerts.",
    ],
    limitations: [
      "Tracking begins with your first scan and cannot reconstruct earlier unfollows.",
      "A follow and unfollow that both happen between scans may not be visible.",
      "Instagram rate limits can slow or pause scanning and bulk actions.",
    ],
    faq: [
      { question: "Can it show who unfollowed me before installation?", answer: "No. The first scan creates the baseline; unfollower history is calculated by comparing later scans with that baseline." },
      { question: "Where is follower history stored?", answer: "Follower history is stored locally in Chrome extension storage. CleanMySocial does not receive your follower lists." },
      { question: "What is included for free?", answer: "Manual scans, unfollower history, and one-by-one unfollows are free. Pro adds daily scans and alerts, bulk unfollow, and CSV or Excel exports." },
    ],
    storeId: "kfaklckklmlknieiniakbekofgndfpbp",
    storeUrl:
      "https://chromewebstore.google.com/detail/kfaklckklmlknieiniakbekofgndfpbp",
    licenseGroup: "cleanmysocial",
    freePlan: {
      allowance: "Manual scans, history, and one-by-one unfollows",
      headline: "Follower tracking is free to use",
      upgradeMessage: "Upgrade to Pro for automation, bulk tools, and exports.",
    },
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
