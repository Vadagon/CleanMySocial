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
  freePlan?: FreePlan;
  plans: Plan[];
  /**
   * Public Chrome Web Store user count, entered by hand from the live listing.
   * Never estimate or call it purchases/customers: Chrome reports users.
   */
  users: number;
  usersUpdated: string;
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

export function groupOf(_ext: Extension): string {
  return "cleanmysocial";
}

export const BUNDLE_PLAN: Plan = {
  plan: "lifetime",
  label: "All 5 CleanMySocial tools",
  productId: BUNDLE_PRODUCT.id,
  price: BUNDLE_PRODUCT.price,
  cadence: "one-time payment · lifetime access",
  access: "lifetime",
  recurring: false,
  highlight: true,
  description: "All five CleanMySocial extensions in one lifetime package.",
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
      features: "What you can clean",
      steps: "How a cleanup run works",
      limitations: "What it cannot delete",
      faq: "Facebook and Instagram message deletion FAQ",
    },
    shortName: "Facebook & Instagram Cleaner",
    name: "Delete All Messages for Facebook & Instagram",
    tagline: "Clean Messenger conversations and Instagram DMs from one side panel.",
    description:
      "Bulk delete, archive, or restore Facebook Messenger conversations, then scan an Instagram conversation and unsend messages sent by your account.",
    icon: "/extensions/facebook-instagram-cleaner.png",
    users: 7000,
    usersUpdated: "August 14, 2026",
    screenshots: [
      { src: "/screenshots/facebook-instagram-cleaner/screen1.webp", alt: "CleanMySocial side panel for selecting Facebook Messenger conversations to delete, archive, or restore" },
    ],
    features: [
      "Bulk delete Facebook Messenger conversations, archive them, or restore archived chats",
      "Scan an Instagram conversation and bulk unsend the messages you sent",
      "Filter Instagram messages by age or a custom date range",
      "Stealth mode works through older Instagram messages first",
      "Live scanning and cleanup progress, and a stop control for an active batch",
      "Runs in Chrome's side panel beside the Facebook or Instagram tab you are using",
    ],
    steps: [
      "Open Facebook Messenger, or the Instagram conversation you want to clean, in Chrome.",
      "Open the side panel from the extension icon. It sits next to the conversation rather than replacing it.",
      "Pick the action and review exactly what it will affect before anything runs.",
      "Confirm the batch and watch its progress. You can stop it safely part-way through.",
    ],
    limitations: [
      "Deleting a Messenger conversation removes your copy; it does not erase the other participant's copy.",
      "Instagram unsend applies only to messages your own account sent — you cannot unsend the other person's messages.",
      "Deleted conversations and successfully unsent messages may not be recoverable, so review the selection before confirming.",
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
      features: "What you can clean",
      steps: "How a cleanup run works",
      limitations: "What deleting a conversation does not do",
      faq: "Messenger cleanup FAQ",
    },
    shortName: "Messenger Cleaner",
    name: "Messenger Cleaner – Delete All Facebook Messages",
    tagline: "Delete, archive, or restore Messenger conversations in bulk.",
    description:
      "Clean up your Facebook Messenger inbox from a persistent Chrome side panel instead of handling conversations one at a time.",
    icon: "/extensions/facebook-messenger-cleaner.png",
    users: 2000,
    usersUpdated: "August 14, 2026",
    screenshots: [
      { src: "/screenshots/facebook-messenger-cleaner/screen1.webp", alt: "Messenger Cleaner side panel with bulk delete, archive, and restore controls" },
    ],
    features: [
      "Bulk delete Messenger conversations, archive several chats at once, or restore them from Archived",
      "A side panel that stays with you as you move around Messenger",
      "Live progress, a stop control, and a counter for the day's free actions",
      "Several processing speeds, so you can trade pace against caution",
      "Pauses safely on its own if the Messenger tab stops being visible",
      "Understands the common Facebook interface languages, not only English",
    ],
    steps: [
      "Open Facebook Messenger in Chrome and open the extension side panel.",
      "Choose the conversations, then the action: delete, archive, or restore.",
      "Confirm. Deletion always asks explicitly, because it can be permanent.",
      "Keep the Messenger tab visible while it runs. Cleanup pauses if you switch away and picks up when you return.",
    ],
    limitations: [
      "Deleting removes the conversation from your account, not from the other participant's account.",
      "Deleting a conversation can be permanent, which is why the extension asks you to confirm first.",
      "The Messenger tab has to stay visible for a run to keep going.",
      "Facebook interface changes can temporarily interrupt automated actions.",
    ],
    faq: [
      { question: "Can I use Messenger Cleaner for free?", answer: "Yes. The free plan includes 10 successful delete or archive actions per day, and restoring archived chats is always free. The lifetime upgrade removes the daily limit." },
      { question: "Does Messenger Cleaner upload my conversations?", answer: "No. Conversation cleanup runs in your browser and message contents are not sent to CleanMySocial." },
      { question: "Can I archive instead of delete?", answer: "Yes. The extension supports bulk archive as well as delete and restore actions." },
      { question: "Is this a lifetime purchase?", answer: "The currently listed Messenger Cleaner plan is a one-time purchase with lifetime access for the commercial lifetime of the product, subject to the Terms of Service." },
    ],
    storeId: "imobgpikmofiapbnijmebknbkmkncdkl",
    storeUrl:
      "https://chromewebstore.google.com/detail/imobgpikmofiapbnijmebknbkmkncdkl",
    licenseGroup: "cleanmysocial",
    freePlan: {
      allowance: "10 delete or archive actions per day",
      headline: "Messenger cleanup is free to use",
      upgradeMessage: "Upgrade for unlimited cleanup.",
    },
    plans: singlePlan("facebook-messenger-cleaner"),
  },
  {
    slug: "mass-unfriender",
    detailHeadings: {
      features: "What you can do with your friends list",
      steps: "How bulk unfriending works",
      limitations: "Limits, and what to expect from Facebook",
      faq: "Facebook bulk unfriend FAQ",
    },
    shortName: "Mass Friends Remover",
    name: "Mass Friends Remover for Facebook — Bulk Unfriender",
    tagline: "Select and unfriend multiple Facebook friends from one screen.",
    description:
      "Review, select, and remove friends from your own Facebook account in bulk instead of visiting profiles one by one.",
    icon: "/extensions/mass-unfriender.png",
    users: 10000,
    usersUpdated: "August 14, 2026",
    screenshots: [
      { src: "/screenshots/mass-unfriender/screen1.webp", alt: "Mass Friends Remover list for reviewing and selecting Facebook friends before removal" },
    ],
    features: [
      "Your whole friends list loads on its own — no scrolling to make Facebook reveal more of it",
      "Search by name, filter by mutual friends or missing photo, and sort A to Z",
      "Tick people individually, or select everything currently shown in one tap",
      "Four removal speeds. Slow and Normal are free; Fast and Ultra come with the upgrade",
      "A live countdown to the next removal, batch progress, and a stop button",
      "The loaded list is cached on your device, so reopening the panel is instant",
      "Export your friends list to CSV with the upgrade",
    ],
    steps: [
      "Click the toolbar icon. The side panel opens beside Facebook straight away.",
      "Your friends load by themselves; the reload button fetches a fresh copy when you want one.",
      "Search, filter, and tick the people to remove. Nothing is removed until you confirm.",
      "Choose Unfriend selected and confirm. A delay is kept between removals because Facebook limits fast friend changes, and you can stop at any point.",
    ],
    limitations: [
      "Reviewing the selection is your call, and the extension cannot undo a removal once it has run.",
      "Facebook limits very fast friend changes, so a safe delay sits between removals and a long list takes time.",
      "The free plan removes up to 20 friends per day, at Slow or Normal speed.",
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
    slug: "instagram-dm-cleaner",
    detailHeadings: {
      features: "What DM Cleaner can remove",
      steps: "How to bulk-unsend Instagram messages",
      limitations: "Important Instagram and deletion limits",
      faq: "Instagram DM Cleaner FAQ",
    },
    shortName: "DM Cleaner",
    name: "DM Cleaner – Bulk Delete Instagram Messages",
    tagline: "Delete all Instagram messages at once. Bulk unsend all DMs on IG.",
    description:
      "Clean up an Instagram conversation without removing every message one by one. DM Cleaner scans the chat open in your active Chrome tab, finds the messages sent by your account, and helps you bulk unsend selected Instagram DMs from a convenient side panel.",
    icon: "/extensions/instagram-dm-cleaner.png",
    users: 35,
    usersUpdated: "August 19, 2026",
    features: [
      "Bulk unsend multiple Instagram messages from one conversation",
      "Scan the full open chat and count the messages your account sent",
      "Delete everything, messages older than 1 month, 6 months, or 1 year, or use a custom date range",
      "Stealth mode processes older messages before newer ones",
      "Careful pacing with automatic slowdown when Instagram limits actions, plus a stop control",
      "Keep Instagram and DM Cleaner visible side by side, with clear scan and deletion progress",
      "Your message content and Instagram account details stay in the browser",
    ],
    steps: [
      "Install DM Cleaner and sign in to Instagram in Chrome.",
      "Open the exact DM conversation you want to clean.",
      "Open DM Cleaner from the extension icon.",
      "Scan the conversation and choose which messages to remove.",
      "Confirm and let DM Cleaner unsend them individually.",
    ],
    screenshots: [
      { src: "/screenshots/instagram-dm-cleaner/screen1.webp", alt: "DM Cleaner side panel scanning an Instagram conversation, with scan, delete-without-scanning, and stop controls" },
    ],
    limitations: [
      "DM Cleaner can unsend only messages sent by your own Instagram account.",
      "A successfully unsent message is removed for everyone and cannot be restored by the extension.",
      "Instagram processes messages individually and may temporarily rate-limit repeated actions, so large cleanups take time.",
      "Instagram interface or private API changes can temporarily interrupt scanning or unsending.",
      "Keep the correct Instagram conversation open while cleaning.",
    ],
    faq: [
      { question: "Can I try DM Cleaner before upgrading?", answer: "Yes. DM Cleaner includes generous daily use so you can try the complete cleanup workflow first. The unlimited option is a one-time purchase with lifetime access for the commercial lifetime of the product, subject to the Terms of Service." },
      { question: "Does CleanMySocial receive my Instagram messages?", answer: "No. Scanning and unsending use your existing browser session. Message text, conversation details, cookies, and Instagram account information are not sent to CleanMySocial." },
      { question: "Can it delete messages sent by someone else?", answer: "No. Instagram allows your account to unsend only messages that your own account sent." },
      { question: "Can I restore access on another browser?", answer: "Yes. Paste the license key emailed after payment into the extension's Restore field." },
    ],
    storeId: "aekeomcopkngciopbjbdmlmpgfdcndmm",
    storeUrl: "https://chromewebstore.google.com/detail/aekeomcopkngciopbjbdmlmpgfdcndmm",
    licenseGroup: "cleanmysocial",
    freePlan: {
      allowance: "Generous daily cleanup use",
      headline: "Try DM Cleaner before upgrading",
      upgradeMessage: "Choose unlimited access after you reach the free allowance.",
    },
    plans: singlePlan("instagram-dm-cleaner"),
  },
  {
    slug: "instagram-followers-tracker",
    detailHeadings: {
      features: "What you can see and do",
      steps: "How unfollower tracking works",
      limitations: "What tracking cannot show you",
      faq: "Instagram unfollowers FAQ",
    },
    shortName: "Followers Tracker",
    name: "Followers Tracker for Instagram – Unfollowers & Bulk Unfollow",
    tagline:
      "See who unfollowed you, get automatic daily alerts, bulk unfollow non-followers, and export your lists.",
    description:
      "Manual scans, unfollower history, and one-by-one unfollows are free. Pro adds an automatic daily scan with desktop unfollower notifications, safe bulk unfollow, and one-click CSV or Excel exports. Your follower data stays locally in your browser.",
    icon: "/extensions/instagram-followers-tracker.png",
    users: 33,
    usersUpdated: "August 14, 2026",
    screenshots: [
      { src: "/screenshots/instagram-followers-tracker/workflow-2026.webp", alt: "Followers Tracker for Instagram workflow for choosing an account and list, reviewing non-followers, unfollowing, and downloading results" },
    ],
    features: [
      "See exactly who unfollowed you and when; new followers are tracked the same way",
      "Filter changes by last scan, 7 days, or 1, 3, 6, or 12 months",
      "See who you follow that does not follow back, and who follows you that you do not follow back",
      "Works on your own account and on any public profile",
      "Bulk unfollow non-followers, a selection, or everyone listed, with Pro",
      "Set the pace anywhere from 3 to 300 seconds, with live progress and a stop button",
      "Shield accounts you never want touched, and skip verified accounts",
      "Pauses by itself if Instagram rate-limits you, then carries on",
      "Export followers and following to CSV or real Excel with Pro — username, full name, profile URL, user ID, private and verified flags",
    ],
    steps: [
      "Install it and sign into Instagram in the same Chrome profile.",
      "Run the first scan. It builds a local baseline, which is necessary because Instagram keeps no unfollower history of its own.",
      "Run later scans to see who changed since that baseline.",
      "Unfollow from the results one at a time for free, or with Pro tick rows and run a paced bulk unfollow.",
    ],
    limitations: [
      "Tracking begins at your first scan and cannot reconstruct unfollows from before it.",
      "Someone who follows and then unfollows between two scans may never appear.",
      "Instagram rate limits can slow or pause scanning and bulk actions, and unfollowing too quickly can get an account action-blocked.",
      "History is stored locally in the browser, so it does not follow you to another browser or device.",
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
