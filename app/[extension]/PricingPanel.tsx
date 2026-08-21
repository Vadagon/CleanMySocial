"use client";

import { useEffect, useRef, useState } from "react";
import type { FreePlan, Plan } from "@/lib/extensions";
import { CURRENCY, priceValue, productItem, track } from "@/lib/analytics";
import Link from "next/link";
import PaymentNotice from "@/app/PaymentNotice";
import { PurchaseTrustBadges } from "@/app/PurchaseAssurances";
import { SITE } from "@/lib/site";

const PLACEHOLDER_PREFIX = "prod_PLACEHOLDER_";

export default function PricingPanel({
  extension,
  storeUrl,
  plans,
  users,
  compact = false,
  detail = false,
}: {
  extension: string;
  storeUrl?: string;
  plans: Plan[];
  users?: number;
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
  // Which price the buyer is looking at. Lifetime leads: it is two months of
  // the subscription and never churns.
  const [choice, setChoice] = useState<Plan>(
    () => plans.find((plan) => !plan.recurring) ?? plans[0],
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
    const plan = plans[0];
    if (plan) {
      track("view_item", {
        currency: CURRENCY,
        value: priceValue(plan.price),
        items: plans.map(productItem),
        placement: extension,
        from_extension: Boolean(fromUrl),
      });
    }
    // Fire once per mount — plans/extension are static per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPlan) emailRef.current?.focus();
  }, [selectedPlan]);

  useEffect(() => {
    if (selectedPlan || buyButtonViewTrackedRef.current) return;
    const button = buyButtonRef.current;
    const plan = plans[0];
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
  }, [extension, plans, selectedPlan]);

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
    });
    track("select_item", {
      currency: CURRENCY,
      value: priceValue(plan.price),
      items: [productItem(plan)],
      item_list_id: "lifetime_access",
      placement: extension,
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
          ← Back
        </button>
        <span className="detail-plan-kicker">Secure checkout</span>
        <h2>Where should we send your license key?</h2>
        <div className="checkout-selection" aria-label="Selected product">
          <span>
            <strong>{plan.label}</strong>
            <small>{plan.cadence}</small>
          </span>
          <strong className="checkout-selection-price">{plan.price.replace(/\.00$/, "")}</strong>
        </div>

        <div className="buy-field">
          <label htmlFor={emailInputId}>Email for your license key</label>
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
                });
              } else if (emailOk && !emailTrackedRef.current) {
                emailTrackedRef.current = true;
                track("add_contact_info", {
                  currency: CURRENCY,
                  value: priceValue(plan.price),
                  items: [productItem(plan)],
                  placement: extension,
                });
              }
            }}
            aria-describedby={emailHintId}
          />
          <span id={emailHintId} className="small muted">
            We email your key after successful payment, and show it on the next
            page. Paste it into the extension&rsquo;s unlock field to activate.
            Your address is used only for your license and support.
          </span>
        </div>

        <button
          type="button"
          className="btn checkout-continue"
          onClick={() => buy(plan)}
          disabled={busy !== null || !licenseKey || !emailOk}
        >
          {busy === plan.plan ? "Opening secure checkout…" : "Continue to secure checkout"}
        </button>
        {err && <p className="checkout-error small">{err}</p>}
      </div>
    );
  }

  async function buy(plan: Plan) {
    setErr(null);
    if (!emailOk) {
      // Defensive only — the button is disabled in this state.
      setErr("Enter the email address where we should send your license key.");
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
    });
    // Funnel step 2: intent. Compare against `purchase` for checkout drop-off.
    track("begin_checkout", {
      currency: CURRENCY,
      value: priceValue(plan.price),
      items: [productItem(plan)],
      placement: extension,
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
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout.");
      }
      track("checkout_handoff", {
        currency: CURRENCY,
        value: priceValue(plan.price),
        items: [productItem(plan)],
        placement: extension,
        provider: "creem",
      });
      window.location.href = data.url;
    } catch (e) {
      // A failed session creation is invisible in Creem's numbers — catch it here.
      track("checkout_error", { placement: extension });
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  if (detail) {
    if (!plans.length) return null;

    if (selectedPlan) {
      return <div className="detail-checkout detail-checkout--email">{emailStep(selectedPlan)}</div>;
    }

    const buyable = !choice?.productId.startsWith(PLACEHOLDER_PREFIX);
    const monthly = plans.find((p) => p.recurring);
    const lifetime = plans.find((p) => !p.recurring);
    const price = (value: string) => value.replace(/\.00$/, "");

    return (
      <div className="detail-checkout">
        <div className="detail-trusted-badge">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.8 19 5.5v5.4c0 4.4-2.9 8.4-7 10.3-4.1-1.9-7-5.9-7-10.3V5.5L12 2.8Z" />
            <path d="m8.8 11.8 2 2 4.4-5" />
          </svg>
          {users
            ? `Trusted by ${users.toLocaleString("en-US")}+ users`
            : "New · 14-day money-back guarantee"}
        </div>
        <h2 className="paid-upgrade-title">Choose how you pay</h2>

        <div className="plan-picker" role="radiogroup" aria-label="Choose a plan">
          {[monthly, lifetime].filter(Boolean).map((plan) => {
            const p = plan as Plan;
            const active = choice?.productId === p.productId;
            return (
              <button
                key={p.productId}
                type="button"
                role="radio"
                aria-checked={active}
                className={`plan-option${active ? " selected" : ""}`}
                onClick={() => setChoice(p)}
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
                  {price(p.price)}
                  {p.recurring ? <small>/mo</small> : null}
                </span>
              </button>
            );
          })}
        </div>

        <PurchaseTrustBadges detail recurring={Boolean(choice?.recurring)} />
        <button
          ref={buyButtonRef}
          type="button"
          className="btn detail-buy-button"
          onClick={() => choose(choice)}
          disabled={!licenseKey || !choice || !buyable}
        >
          {!buyable
            ? "Available shortly"
            : choice?.recurring
              ? `Subscribe — ${price(choice.price)}/mo`
              : `Get lifetime — ${price(choice?.price ?? "")}`}
        </button>
        {err && <p className="checkout-error small">{err}</p>}
        <div className="detail-secure-footer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5.5" y="10" width="13" height="10" rx="2" />
            <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
          </svg>
          Secure payment · Instant access
        </div>
        <p className="detail-seller-note">
          Sold and supported by {SITE.legalName}.{" "}
          {storeUrl ? (
            <>
              <a href={storeUrl} target="_blank" rel="noreferrer">
                Read the store reviews
              </a>
              {" · "}
            </>
          ) : null}
          <Link href={`/privacy/${extension}`}>What it can access</Link>
        </p>
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
              ref={p === plans[0] ? buyButtonRef : undefined}
              type="button"
              className={`btn${p.highlight ? "" : " secondary"}`}
              style={{ width: "100%" }}
              onClick={() => choose(p)}
              disabled={!licenseKey}
            >
              {p.recurring
                ? "Subscribe"
                : `Get lifetime — ${p.price.replace(/\.00$/, "")}`}
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
