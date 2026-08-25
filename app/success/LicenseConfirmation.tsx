"use client";

import { useEffect, useRef, useState } from "react";
import { CURRENCY, priceValue, track } from "@/lib/analytics";
import { PRICING_VARIANT, type Product } from "@/lib/products";

type State = "confirming" | "confirmed" | "waiting";

export default function LicenseConfirmation({
  enabled,
  licenseKey,
  product,
}: {
  enabled: boolean;
  licenseKey?: string;
  product?: Product;
}) {
  const [state, setState] = useState<State>(enabled ? "confirming" : "waiting");
  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function confirm() {
      try {
        const response = await fetch(`/api/creem/confirm${window.location.search}`, {
          cache: "no-store",
        });
        const result = (await response.json()) as {
          confirmed?: boolean;
          key?: string;
          productId?: string;
        };
        const confirmed = response.ok && result.confirmed === true;
        if (!cancelled) {
          setState(confirmed ? "confirmed" : "waiting");
          if (
            confirmed &&
            product &&
            result.productId === product.id &&
            result.key === licenseKey &&
            !purchaseTrackedRef.current
          ) {
            purchaseTrackedRef.current = true;
            track("purchase", {
              transaction_id: result.key || licenseKey || "unknown",
              currency: CURRENCY,
              value: priceValue(product.price),
              pricing_variant: PRICING_VARIANT,
              selected_plan: product.access === "pass"
                ? "hot"
                : product.access === "subscription"
                  ? "monthly"
                  : "lifetime",
              placement: product.entitlements[0] || "cleanmysocial",
              items: [
                {
                  item_id: product.id,
                  item_name: product.name,
                  item_category: product.access === "pass"
                    ? "hot"
                    : product.access === "subscription"
                      ? "monthly"
                      : "lifetime",
                  price: priceValue(product.price),
                  quantity: 1,
                },
              ],
            });
          }
        }
      } catch {
        if (!cancelled) setState("waiting");
      }
    }

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [enabled, licenseKey, product]);

  return (
    <p className={`confirmation-status confirmation-${state}`} role="status">
      {state === "confirmed"
        ? "Your license is active and its key has been emailed to you."
        : state === "confirming"
          ? "Confirming and activating your license…"
          : "Creem is still confirming your order. Keep this page open or check your email in a few minutes."}
    </p>
  );
}
