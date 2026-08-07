"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Plan } from "@/lib/extensions";
import { CURRENCY, priceValue, productItem, track } from "@/lib/analytics";

export default function PricingPanel({
  extension,
  plans,
  compact = false,
  detail = false,
  packagesOnly = false,
}: {
  extension: string;
  plans: Plan[];
  /** à-la-carte cards: just the field and the button, no repeated badges */
  compact?: boolean;
  /** laptop-first extension detail page purchase card */
  detail?: boolean;
  /** full-width package offers shown below an extension's main content */
  packagesOnly?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  // The license key: passed by the extension as ?lk=..., or generated here for
  // direct visitors (who then paste it into the extension to unlock).
  const [licenseKey, setLicenseKey] = useState<string>("");
  const emailInputId = `license-email-${plans[0]?.productId || extension}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "-",
  );
  const emailHintId = `${emailInputId}-hint`;

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("lk");
    setLicenseKey(fromUrl && fromUrl.trim() ? fromUrl.trim() : crypto.randomUUID());
    // Funnel step 1: the buy panel was actually seen. `from_extension` splits
    // in-extension traffic (arrives with ?lk=) from people browsing the site.
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

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  function choose(plan: Plan) {
    setErr(null);
    setSelectedPlan(plan);
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
        <span className="detail-plan-kicker">One last step</span>
        <h2>Where should we send your license key?</h2>
        <div className="checkout-selection" aria-label="Selected product">
          <span>
            <strong>{plan.label}</strong>
            <small>{plan.cadence}</small>
          </span>
          <strong className="checkout-selection-price">{plan.price}</strong>
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
              }
            }}
            aria-describedby={emailHintId}
          />
          <span id={emailHintId} className="small muted">
            We email the key here right after payment. Used only for your license
            and support.
          </span>
        </div>

        <button
          type="button"
          className="btn checkout-continue"
          onClick={() => buy(plan)}
          disabled={busy !== null || !licenseKey || !emailOk}
        >
          {busy === plan.plan ? "Opening checkout…" : "Continue"}
        </button>
        <div className="secure-checkout" aria-label="Secure checkout">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <rect x="5.5" y="8.5" width="9" height="7.5" rx="1.5" />
            <path d="M7.5 8.5V6.7a2.5 2.5 0 0 1 5 0v1.8" />
          </svg>
          Secure checkout
        </div>
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
      window.location.href = data.url;
    } catch (e) {
      // A failed session creation is invisible in Creem's numbers — catch it here.
      track("checkout_error", { placement: extension });
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  if (packagesOnly) {
    if (selectedPlan) {
      return (
        <section className="extension-packages-section" aria-label="Package checkout">
          <div className="bottom-package-checkout">{emailStep(selectedPlan)}</div>
        </section>
      );
    }

    return (
      <section className="extension-packages-section" aria-labelledby="package-options-title">
        <div className="detail-packages-heading">
          <span id="package-options-title">Save with a package</span>
          <small>Use the same license key for every included tool.</small>
        </div>
        <div className="detail-package-list">
          {plans.map((item) => (
            <article
              className={`detail-package-option${item.highlight ? " is-bundle" : ""}`}
              key={item.productId}
            >
              <div className="detail-package-topline">
                {item.badge ? <span className="badge-soft">{item.badge}</span> : null}
                <span className="detail-package-price">
                  <strong>{item.price}</strong>
                  {item.compareAt ? <s>{item.compareAt}</s> : null}
                </span>
              </div>
              <h3>{item.label}</h3>
              {item.description ? <p>{item.description}</p> : null}
              <button
                type="button"
                className="btn secondary detail-package-buy"
                onClick={() => choose(item)}
                disabled={!licenseKey}
              >
                {item.highlight ? "Buy all tools" : "Buy this package"}
              </button>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (detail) {
    const plan = plans[0];
    if (!plan) return null;

    if (selectedPlan) {
      return <div className="detail-checkout">{emailStep(selectedPlan)}</div>;
    }

    return (
      <div className="detail-checkout">
        <span className="detail-plan-kicker">Buy this extension</span>
        <div className="detail-plan-label">{plan.label}</div>
        <div className="detail-amount">{plan.price}</div>
        <div className="detail-cadence">{plan.cadence}</div>

        <button
          type="button"
          className="btn detail-buy-button"
          onClick={() => choose(plan)}
          disabled={!licenseKey}
        >
          Buy now
        </button>
        <div className="secure-checkout" aria-label="Secure checkout">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <rect x="5.5" y="8.5" width="9" height="7.5" rx="1.5" />
            <path d="M7.5 8.5V6.7a2.5 2.5 0 0 1 5 0v1.8" />
          </svg>
          Secure checkout
        </div>

        {err && <p className="checkout-error small">{err}</p>}

        <ul className="trust-badges" aria-label="Purchase guarantees">
          <li>
            <span className="trust-icon" aria-hidden="true">↺</span>
            <span>
              <strong>14-day money back</strong>
              <span className="trust-sub">No questions asked</span>
            </span>
          </li>
          <li>
            <span className="trust-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </span>
            <span>
              <strong>Creem handles payment</strong>
              <span className="trust-sub">
                Merchant of Record · we never see your card
              </span>
            </span>
          </li>
          <li>
            <span className="trust-icon" aria-hidden="true">✓</span>
            <span>
              <strong>No account needed</strong>
              <span className="trust-sub">
                One-time payment, lifetime access
              </span>
            </span>
          </li>
        </ul>
      </div>
    );
  }

  if (selectedPlan) return emailStep(selectedPlan);

  return (
    <div>
      <div className="plans">
        {plans.map((p) => (
          <div key={p.plan} className={`plan${p.highlight ? " highlight" : ""}`}>
            {p.highlight && <span className="badge">Best value</span>}
            <div className="plan-label">{p.label}</div>
            <div className="amount">{p.price}</div>
            <div className="cadence">{p.cadence}</div>
            <button
              type="button"
              className={`btn${p.highlight ? "" : " secondary"}`}
              style={{ width: "100%" }}
              onClick={() => choose(p)}
              disabled={!licenseKey}
            >
              {p.recurring ? "Subscribe" : "Buy now"}
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
      <ul className="trust-badges" aria-label="Purchase guarantees">
        <li>
          <span className="trust-icon" aria-hidden="true">↺</span>
          <span>
            <strong>14-day money back</strong>
            <span className="trust-sub">No questions asked</span>
          </span>
        </li>
        <li>
          <span className="trust-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </span>
          <span>
            <strong>Creem handles payment</strong>
            <span className="trust-sub">Merchant of Record · we never see your card</span>
          </span>
        </li>
        <li>
          <span className="trust-icon" aria-hidden="true">✓</span>
          <span>
            <strong>No account needed</strong>
            <span className="trust-sub">One-time payment, lifetime access</span>
          </span>
        </li>
      </ul>
      )}

      {compact ? null : (
      <div className="notice small">
        Payments are securely processed by <strong>Creem</strong>, our
        Merchant of Record. Your license unlocks the product or package you
        choose after payment. See our{" "}
        <Link href="/refund">Refund Policy</Link> and{" "}
        <Link href="/terms">Terms</Link>.
      </div>
      )}
    </div>
  );
}
