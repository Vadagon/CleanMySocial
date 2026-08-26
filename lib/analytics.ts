"use client";

import type { Plan } from "@/lib/extensions";

// Thin gtag wrapper. GoogleAnalytics only renders in production, so in dev
// window.gtag is undefined and every call here is a no-op.

type GtagParams = Record<string, string | number | boolean | object | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, event: string, params?: GtagParams) => void;
    dataLayer?: unknown[];
  }
}

export const CURRENCY = "USD";
/** GA4 wants a number, while Plan.price is a display string like "$8.00". */
export function priceValue(price: string): number {
  return Number(price.replace(/[^0-9.]/g, "")) || 0;
}

export function track(event: string, params: GtagParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    // Queue early funnel events even when the deferred GA loader has not run
    // yet. The analytics script consumes dataLayer after the first interaction.
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer?.push(arguments);
    };
    const pageLocale = new URLSearchParams(window.location.search).get("lang")
      || document.documentElement.lang
      || "en";
    window.gtag("event", event, { product_locale: pageLocale, ...params });
  } catch {
    // analytics must never break the page
  }
}

/** The exact product selected in the checkout panel. */
export function productItem(plan: Plan) {
  return {
    item_id: plan.productId,
    item_name: plan.label,
    item_category: plan.plan,
    price: priceValue(plan.price),
    quantity: 1,
  };
}
