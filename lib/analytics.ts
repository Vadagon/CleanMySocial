"use client";

// Thin gtag wrapper. GoogleAnalytics only renders in production, so in dev
// window.gtag is undefined and every call here is a no-op.

type GtagParams = Record<string, string | number | boolean | object | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, event: string, params?: GtagParams) => void;
  }
}

export const CURRENCY = "USD";
/** GA4 wants a number, while Plan.price is a display string like "$8.00". */
export function priceValue(price: string): number {
  return Number(price.replace(/[^0-9.]/g, "")) || 0;
}

export function track(event: string, params: GtagParams = {}): void {
  if (typeof window === "undefined" || !window.gtag) return;
  try {
    window.gtag("event", event, params);
  } catch {
    // analytics must never break the page
  }
}

/** The bundle as a GA4 ecommerce item. */
export function bundleItem(price: string) {
  return {
    item_id: "cleanmysocial-lifetime",
    item_name: "CleanMySocial Lifetime",
    price: priceValue(price),
    quantity: 1,
  };
}
