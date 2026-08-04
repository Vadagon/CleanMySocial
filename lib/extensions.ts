export type Access = "lifetime";

export interface Plan {
  plan: string;
  label: string;
  productId: string;
  price: string;
  cadence: string;
  access: Access;
  recurring: false;
  highlight?: boolean;
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
}

export function groupOf(_ext: Extension): string {
  return "cleanmysocial";
}

export const BUNDLE_PLAN: Plan = {
  plan: "lifetime",
  label: "All 3 premium extensions",
  productId:
    process.env.CREEM_BUNDLE_PRODUCT_ID || "prod_4tUdIIAOSGXJAxFUapCPdh",
  price: "$8.00",
  cadence: "one-time payment · lifetime access",
  access: "lifetime",
  recurring: false,
  highlight: true,
};

export const EXTENSIONS: Extension[] = [
  {
    slug: "facebook-instagram-cleaner",
    name: "Delete All Messages for Facebook & Instagram",
    tagline: "Clean Messenger conversations and Instagram DMs from one side panel.",
    description:
      "Bulk delete, archive, or restore Facebook Messenger conversations, then scan an Instagram conversation and unsend messages sent by your account.",
    icon: "/extensions/facebook-instagram-cleaner.png",
    storeId: "cboolboidgkagffpalhlojepcghkkfej",
    storeUrl:
      "https://chromewebstore.google.com/detail/cboolboidgkagffpalhlojepcghkkfej",
    licenseGroup: "cleanmysocial",
    plans: [BUNDLE_PLAN],
  },
  {
    slug: "facebook-messenger-cleaner",
    name: "Messenger Cleaner – Delete All Facebook Messages",
    tagline: "Delete, archive, or restore Messenger conversations in bulk.",
    description:
      "Clean up your Facebook Messenger inbox from a persistent Chrome side panel instead of handling conversations one at a time.",
    icon: "/extensions/facebook-messenger-cleaner.png",
    storeId: "imobgpikmofiapbnijmebknbkmkncdkl",
    storeUrl:
      "https://chromewebstore.google.com/detail/imobgpikmofiapbnijmebknbkmkncdkl",
    licenseGroup: "cleanmysocial",
    plans: [BUNDLE_PLAN],
  },
  {
    slug: "mass-unfriender",
    name: "CleanMySocial Mass Unfriender",
    tagline: "Select and unfriend multiple Facebook friends from one screen.",
    description:
      "Review, select, and remove friends from your own Facebook account in bulk instead of visiting profiles one by one.",
    icon: "/extensions/mass-unfriender.png",
    storeId: "fegkbiinmaoipoonnlhekdoefgebmdnj",
    storeUrl:
      "https://chromewebstore.google.com/detail/fegkbiinmaoipoonnlhekdoefgebmdnj",
    licenseGroup: "cleanmysocial",
    plans: [BUNDLE_PLAN],
  },
  {
    slug: "instagram-dm-cleaner",
    name: "DM Cleaner – Bulk Delete Instagram Messages",
    tagline: "Scan one Instagram conversation and bulk unsend your messages.",
    description:
      "Choose an open Instagram conversation, filter messages sent by your account, and unsend them with paced processing and clear progress.",
    icon: "/extensions/instagram-dm-cleaner.png",
    storeId: "aekeomcopkngciopbjbdmlmpgfdcndmm",
    storeUrl:
      "https://chromewebstore.google.com/detail/aekeomcopkngciopbjbdmlmpgfdcndmm",
    licenseGroup: "cleanmysocial",
    plans: [],
  },
];

export const PREMIUM_EXTENSIONS = EXTENSIONS.filter(
  (extension) => extension.plans.length > 0,
);

const EXTENSION_ALIASES: Record<string, string> = {
  "messenger-cleaner": "facebook-instagram-cleaner",
  "mass-friends-remover": "mass-unfriender",
  "instagram-cleaner": "instagram-dm-cleaner",
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

export function findByProductId(productId: string):
  | { extension: Extension; plan: Plan }
  | undefined {
  if (productId !== BUNDLE_PLAN.productId) return undefined;
  return { extension: PREMIUM_EXTENSIONS[0], plan: BUNDLE_PLAN };
}
