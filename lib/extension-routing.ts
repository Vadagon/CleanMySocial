/** Lightweight route data safe to bundle into Edge middleware. */
export const CANONICAL_EXTENSION_SLUGS = [
  "facebook-instagram-cleaner",
  "facebook-messenger-cleaner",
  "mass-unfriender",
  "instagram-dm-cleaner",
  "instagram-followers-tracker",
  "facebook-activity-cleaner",
  "cleanerx",
  "reddit-cleaner",
  "cleanfeed",
] as const;

export const EXTENSION_ALIASES: Record<string, string> = {
  "messenger-cleaner": "facebook-instagram-cleaner",
  "mass-friends-remover": "mass-unfriender",
  "followers-tracker": "instagram-followers-tracker",
  "ig-followers-tracker": "instagram-followers-tracker",
};

export const EXTENSION_STATIC_SLUGS = [
  ...CANONICAL_EXTENSION_SLUGS,
  ...Object.keys(EXTENSION_ALIASES),
];
