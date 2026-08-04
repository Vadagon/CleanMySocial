export const SITE = {
  name: "CleanMySocial",
  domain: "cleanmysocial.verblike.com",
  url: "https://cleanmysocial.verblike.com",
  supportEmail: "info@verblike.com",
  legalName: "Vladyslav Verbytskyi",
  legalProvider: "Vladyslav Verbytskyi, an individual software developer",
  description:
    "Four focused Chrome extensions for cleaning up your own social accounts, with three premium tools in one lifetime bundle.",
};

export const CREEM = {
  apiKey: process.env.CREEM_API_KEY || "",
  apiUrl: process.env.CREEM_API_URL || "https://api.creem.io/v1",
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET || "",
};
