export const SITE = {
  name: "CleanMySocial",
  domain: "cleanmysocial.verblike.com",
  url: "https://cleanmysocial.verblike.com",
  supportEmail: "info@verblike.com",
  legalName: "Vladyslav Verbytskyi",
  legalProvider: "Vladyslav Verbytskyi, an individual software developer",
  description:
    "Four focused Chrome extensions for cleaning up your own social accounts — available separately or in discounted lifetime packages.",
};

// Google Analytics 4 — "My Website" stream for cleanmysocial.verblike.com.
// Set NEXT_PUBLIC_GA_ID to override, or to an empty value to disable.
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID ?? "G-51L37C7EGC";

export const CREEM = {
  apiKey: process.env.CREEM_API_KEY || "",
  apiUrl: process.env.CREEM_API_URL || "https://api.creem.io/v1",
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET || "",
};
