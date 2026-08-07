"use client";

import { useEffect } from "react";
import { BUNDLE_PLAN } from "@/lib/extensions";
import { CURRENCY, bundleItem, priceValue, track } from "@/lib/analytics";

/**
 * Funnel step 3. The license key doubles as the GA transaction id, so a
 * reloaded or bookmarked success page dedupes instead of double-counting.
 *
 * This is a front-end signal for funnel shape only — Creem remains the source
 * of truth for revenue, since a buyer who closes the tab never reaches here.
 */
export default function PurchaseEvent({ licenseKey }: { licenseKey?: string }) {
  useEffect(() => {
    track("purchase", {
      transaction_id: licenseKey || "unknown",
      currency: CURRENCY,
      value: priceValue(BUNDLE_PLAN.price),
      items: [bundleItem(BUNDLE_PLAN.price)],
    });
  }, [licenseKey]);

  return null;
}
