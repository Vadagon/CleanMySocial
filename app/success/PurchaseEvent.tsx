"use client";

import { useEffect } from "react";
import { CURRENCY, priceValue, track } from "@/lib/analytics";
import type { Product } from "@/lib/products";

/**
 * Funnel step 3. The license key doubles as the GA transaction id, so a
 * reloaded or bookmarked success page dedupes instead of double-counting.
 *
 * This is a front-end signal for funnel shape only — Creem remains the source
 * of truth for revenue, since a buyer who closes the tab never reaches here.
 */
export default function PurchaseEvent({
  licenseKey,
  product,
}: {
  licenseKey?: string;
  product?: Product;
}) {
  useEffect(() => {
    track("purchase", {
      transaction_id: licenseKey || "unknown",
      currency: CURRENCY,
      ...(product
        ? {
            value: priceValue(product.price),
            items: [
              {
                item_id: product.id,
                item_name: product.name,
                price: priceValue(product.price),
                quantity: 1,
              },
            ],
          }
        : {}),
    });
  }, [licenseKey, product]);

  return null;
}
