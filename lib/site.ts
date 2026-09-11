export const SITE = {
  name: "CleanMySocial",
  domain: "cleanmysocial.com",
  url: "https://cleanmysocial.com",
  supportEmail: "info@verblike.com",
  /**
   * The seller a customer contracts with and pays. It matches how the Creem
   * merchant account is registered, and Terms, Refund and Privacy must keep
   * naming exactly this — if the seller on the invoice and the seller in the
   * terms disagree, the terms are the ones that are wrong.
   */
  legalName: "Vladyslav Verbytskyi",
  legalProvider: "Vladyslav Verbytskyi, an individual software developer",
  description:
    "Ten focused Chrome extensions for cleaning up Gmail and your own social accounts — each paid tool sold separately with pass, monthly, or lifetime access.",
};

// Google Analytics 4 — "My Website" stream for cleanmysocial.com.
// Set NEXT_PUBLIC_GA_ID to override, or to an empty value to disable.
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID ?? "G-51L37C7EGC";

export const CREEM = {
  apiKey: process.env.CREEM_API_KEY || "",
  apiUrl: process.env.CREEM_API_URL || "https://api.creem.io/v1",
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET || "",
};
