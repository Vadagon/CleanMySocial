"use client";

import { useEffect, useRef, useState } from "react";
import type { FreePlan, Plan } from "@/lib/extensions";
import { CURRENCY, priceValue, productItem, track } from "@/lib/analytics";
import PaymentNotice from "@/app/PaymentNotice";
import { PurchaseTrustBadges } from "@/app/PurchaseAssurances";
import { PRICING_VARIANT, UNINSTALL_DISCOUNT_VARIANT } from "@/lib/products";
import { discountCopy } from "@/lib/discount-copy";
import type { Locale } from "@/lib/locales";
import { purchaseCopy } from "@/lib/purchase-copy";

const PLACEHOLDER_PREFIX = "prod_PLACEHOLDER_";
const displayPrice = (value: string) => value.replace(/\.00$/, "");

function ctaLabel(plan: Plan, locale: Locale, discountOffer: boolean): string {
  const copy = purchaseCopy(locale);
  if (plan.access === "pass") {
    const label = discountOffer ? discountCopy(locale).cta : copy.getPass;
    return `${label} — ${displayPrice(plan.price)}`;
  }
  if (plan.access === "subscription") return `${copy.startMonthly} — ${displayPrice(plan.price)}`;
  return `${copy.getLifetime} — ${displayPrice(plan.price)}`;
}

export default function PricingPanel({
  extension,
  storeUrl,
  plans,
  users,
  locale = "en",
  discountOffer = false,
  compact = false,
  detail = false,
}: {
  extension: string;
  storeUrl?: string;
  plans: Plan[];
  users?: number;
  locale?: Locale;
  discountOffer?: boolean;
  freePlan?: FreePlan;
  /** à-la-carte cards: just the field and the button, no repeated badges */
  compact?: boolean;
  /** laptop-first extension detail page purchase card */
  detail?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const pricingVariant = discountOffer ? UNINSTALL_DISCOUNT_VARIANT : PRICING_VARIANT;
  const copy = purchaseCopy(locale);
  // Monthly is the public default; a private uninstall offer selects its pass.
  const [choice, setChoice] = useState<Plan>(
    () => plans.find((plan) => plan.access === (discountOffer ? "pass" : "subscription")) ?? plans[0],
  );
  const emailRef = useRef<HTMLInputElement>(null);
  const emailTrackedRef = useRef(false);
  const buyButtonRef = useRef<HTMLButtonElement>(null);
  const buyButtonViewTrackedRef = useRef(false);
  // The license key is ALWAYS minted here, never taken from the URL.
  //
  // It used to be seeded from the extension's ?lk=... when present. That made
  // the key depend on which page the buyer happened to be standing on: any
  // internal link into /pricing or /packages dropped the parameter, silently
  // minting a different key, and the purchase then landed on a key the
  // extension was not polling. One origin for the key removes that whole class
  // of failure — every buyer unlocks by pasting the emailed key.
  const [licenseKey, setLicenseKey] = useState<string>("");
  const emailInputId = `license-email-${plans[0]?.productId || extension}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "-",
  );
  const emailHintId = `${emailInputId}-hint`;

  useEffect(() => {
    setLicenseKey(crypto.randomUUID());
    // `lk` is read for attribution only — it never becomes the license key.
    // Funnel step 1: the buy panel was actually seen. `from_extension` splits
    // in-extension traffic (arrives with ?lk=) from people browsing the site.
    const fromUrl = new URLSearchParams(window.location.search).get("lk");
    const plan = plans.find((candidate) => candidate.access === (discountOffer ? "pass" : "subscription")) ?? plans[0];
    if (plan) {
      track("view_item", {
        currency: CURRENCY,
        value: priceValue(plan.price),
        items: plans.map(productItem),
        placement: extension,
        from_extension: Boolean(fromUrl),
        pricing_variant: pricingVariant,
        selected_plan: plan.plan,
      });
    }
    // Fire once per mount — plans/extension are static per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPlan) emailRef.current?.focus();
  }, [selectedPlan]);

  // Coming back from the hosted checkout page restores this panel from the
  // back/forward cache with `busy` still set, which leaves the email field and
  // the button frozen. Clear it on restore so the buyer can edit the address
  // and start over, on a fresh key so the two checkouts are separate licenses.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setBusy(null);
      setErr(null);
      setLicenseKey(crypto.randomUUID());
      emailTrackedRef.current = false;
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  useEffect(() => {
    if (selectedPlan || buyButtonViewTrackedRef.current) return;
    const button = buyButtonRef.current;
    const plan = choice;
    if (!button || !plan) return;

    const recordView = () => {
      if (buyButtonViewTrackedRef.current) return;
      buyButtonViewTrackedRef.current = true;
      track("buy_button_view", {
        currency: CURRENCY,
        value: priceValue(plan.price),
        items: [productItem(plan)],
        placement: extension,
        checkout_step: 0,
        pricing_variant: pricingVariant,
        selected_plan: plan.plan,
      });
    };

    if (!("IntersectionObserver" in window)) {
      recordView();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
          recordView();
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(button);
    return () => observer.disconnect();
  }, [choice, extension, selectedPlan]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  function choose(plan: Plan) {
    setErr(null);
    setSelectedPlan(plan);
    // Explicit funnel counter: first purchase-button press, before the email step.
    track("buy_now_click", {
      currency: CURRENCY,
      value: priceValue(plan.price),
      items: [productItem(plan)],
      placement: extension,
      checkout_step: 1,
      pricing_variant: pricingVariant,
      selected_plan: plan.plan,
    });
    track("select_item", {
      currency: CURRENCY,
      value: priceValue(plan.price),
      items: [productItem(plan)],
      item_list_id: "product_access",
      placement: extension,
      pricing_variant: pricingVariant,
      selected_plan: plan.plan,
    });
  }

  function selectPlan(plan: Plan) {
    if (plan.productId === choice?.productId) return;
    setChoice(plan);
    track("select_plan", {
      currency: CURRENCY,
      value: priceValue(plan.price),
      items: [productItem(plan)],
      placement: extension,
      pricing_variant: pricingVariant,
      selected_plan: plan.plan,
    });
  }

  function emailStep(plan: Plan) {
    return (
      <div className={`checkout-email-step${compact ? " checkout-email-step--compact" : ""}`}>
        <button
          type="button"
          className="checkout-step-back"
          onClick={() => {
            setErr(null);
            setSelectedPlan(null);
          }}
          disabled={busy !== null}
        >
          {copy.back}
        </button>
        <span className="detail-plan-kicker">{copy.secureCheckout}</span>
        <h2>{copy.whereKey}</h2>
        <div className="checkout-selection" aria-label={copy.choosePlan}>
          <span>
            <strong>{plan.label}</strong>
            <small>{plan.cadence}</small>
          </span>
          <strong className="checkout-selection-price">{plan.price.replace(/\.00$/, "")}</strong>
        </div>

        <div className="buy-field">
          <label htmlFor={emailInputId}>{copy.emailLabel}</label>
          <input
            ref={emailRef}
            id={emailInputId}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => {
              if (email.trim() && !emailOk) {
                track("checkout_blocked", {
                  reason: "invalid_email",
                  placement: extension,
                  pricing_variant: pricingVariant,
                  selected_plan: plan.plan,
                });
              } else if (emailOk && !emailTrackedRef.current) {
                emailTrackedRef.current = true;
                track("add_contact_info", {
                  currency: CURRENCY,
                  value: priceValue(plan.price),
                  items: [productItem(plan)],
                  placement: extension,
                  pricing_variant: pricingVariant,
                  selected_plan: plan.plan,
                });
              }
            }}
            aria-describedby={emailHintId}
          />
          <span id={emailHintId} className="small muted">
            {copy.emailHint}
          </span>
        </div>

        <button
          type="button"
          className="btn checkout-continue"
          onClick={() => buy(plan)}
          disabled={busy !== null || !licenseKey || !emailOk}
        >
          {busy === plan.plan ? copy.openingCheckout : copy.continueCheckout}
        </button>
        {err && <p className="checkout-error small">{err}</p>}
      </div>
    );
  }

  async function buy(plan: Plan) {
    setErr(null);
    if (!emailOk) {
      // Defensive only — the button is disabled in this state.
      setErr(copy.invalidEmail);
      return;
    }
    setBusy(plan.plan);
    // Explicit funnel counter: second purchase-button press after a valid email.
    // Never send the email address itself to analytics.
    track("checkout_email_continue_click", {
      currency: CURRENCY,
      value: priceValue(plan.price),
      items: [productItem(plan)],
      placement: extension,
      checkout_step: 2,
      pricing_variant: pricingVariant,
      selected_plan: plan.plan,
    });
    // Funnel step 2: intent. Compare against `purchase` for checkout drop-off.
    track("begin_checkout", {
      currency: CURRENCY,
      value: priceValue(plan.price),
      items: [productItem(plan)],
      placement: extension,
      pricing_variant: pricingVariant,
      selected_plan: plan.plan,
    });
    try {
      // Create the Creem checkout session server-side, then redirect the
      // browser to Creem's hosted checkout page.
      const res = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: plan.productId,
          key: licenseKey,
          email: email.trim(),
          locale,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || copy.checkoutError);
      }
      track("checkout_handoff", {
        currency: CURRENCY,
        value: priceValue(plan.price),
        items: [productItem(plan)],
        placement: extension,
        provider: "creem",
        pricing_variant: pricingVariant,
        selected_plan: plan.plan,
      });
      window.location.href = data.url;
    } catch (e) {
      // A failed session creation is invisible in Creem's numbers — catch it here.
      track("checkout_error", {
        placement: extension,
        pricing_variant: pricingVariant,
        selected_plan: plan.plan,
      });
      setErr(e instanceof Error ? e.message : copy.genericError);
      setBusy(null);
    }
  }

  if (detail) {
    if (!plans.length) return null;

    if (selectedPlan) {
      return <div className="detail-checkout detail-checkout--email">{emailStep(selectedPlan)}</div>;
    }

    const buyable = !choice?.productId.startsWith(PLACEHOLDER_PREFIX);
    const hot = plans.find((p) => p.access === "pass");
    const monthly = plans.find((p) => p.access === "subscription");
    const lifetime = plans.find((p) => p.access === "lifetime");
    const onePlan = plans.length === 1 ? plans[0] : null;

    return (
      <div className="detail-checkout">
        <div className="detail-trusted-badge">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.8 19 5.5v5.4c0 4.4-2.9 8.4-7 10.3-4.1-1.9-7-5.9-7-10.3V5.5L12 2.8Z" />
            <path d="m8.8 11.8 2 2 4.4-5" />
          </svg>
          {copy.trusted} {(users ?? 0).toLocaleString(locale.replace("_", "-"))}+ {users === 1 ? copy.user : copy.users}
        </div>
        <h2 className="paid-upgrade-title">
          {onePlan ? copy.getLifetime : copy.chooseAccess}
        </h2>

        {onePlan ? (
          <div className="plans">
            <div className="plan highlight">
              <div className="detail-amount">{displayPrice(onePlan.price)}</div>
              <div className="detail-cadence">{onePlan.cadence}</div>
            </div>
          </div>
        ) : (
        <div className="plan-picker" role="radiogroup" aria-label={copy.choosePlan}>
          {[hot, monthly, lifetime].filter(Boolean).map((plan) => {
            const p = plan as Plan;
            const active = choice?.productId === p.productId;
            return (
              <button
                key={p.productId}
                type="button"
                role="radio"
                aria-checked={active}
                className={`plan-option${active ? " selected" : ""}`}
                onClick={() => selectPlan(p)}
              >
                <span className="plan-option-mark" aria-hidden="true" />
                <span className="plan-option-body">
                  <span className="plan-option-label">
                    {p.label}
                    {p.badge ? <em className="plan-option-badge">{p.badge}</em> : null}
                  </span>
                  <span className="plan-option-cadence">{p.cadence}</span>
                </span>
                <span className="plan-option-price">
                  {discountOffer && p.access === "pass" && p.compareAt ? (
                    <>
                      <del>{displayPrice(p.compareAt)}</del>
                      <strong>{displayPrice(p.price)}</strong>
                    </>
                  ) : displayPrice(p.price)}
                  {p.recurring ? <small>{copy.perMonth}</small> : null}
                </span>
              </button>
            );
          })}
        </div>
        )}

        <PurchaseTrustBadges detail access={choice?.access} locale={locale} />
        <button
          ref={buyButtonRef}
          type="button"
          className="btn detail-buy-button"
          onClick={() => choose(choice)}
          disabled={!licenseKey || !choice || !buyable}
        >
          {!buyable
            ? copy.availableSoon
            : choice
              ? ctaLabel(choice, locale, discountOffer)
              : copy.chooseOption}
        </button>
        {err && <p className="checkout-error small">{err}</p>}
        <div className="detail-secure-footer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5.5" y="10" width="13" height="10" rx="2" />
            <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
          </svg>
          {copy.secureInstant}
        </div>
      </div>
    );
  }

  if (selectedPlan) return emailStep(selectedPlan);

  return (
    <div>
      <div className="plans">
        {plans.map((p) => (
          <div key={p.plan} className={`plan${p.highlight ? " highlight" : ""}`}>
            {p.badge && <span className="badge">{p.badge}</span>}
            <div className="plan-label">{p.label}</div>
            <div className="amount">{p.price.replace(/\.00$/, "")}</div>
            <div className="cadence">{p.cadence}</div>
            <button
              ref={p.productId === choice?.productId ? buyButtonRef : undefined}
              type="button"
              className={`btn${p.highlight ? "" : " secondary"}`}
              style={{ width: "100%" }}
              onClick={() => choose(p)}
              disabled={!licenseKey}
            >
              {ctaLabel(p, locale, discountOffer)}
            </button>
          </div>
        ))}
      </div>

      {err && (
        <p className="small" style={{ color: "#e5484d" }}>
          {err}
        </p>
      )}

      {/* The three objections people actually have at this price, answered
          right where the decision happens rather than in the footer. */}
      {compact ? null : (
        <PurchaseTrustBadges />
      )}

      {compact ? null : (
        <PaymentNotice />
      )}
    </div>
  );
}
