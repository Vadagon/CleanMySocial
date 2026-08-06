"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Plan } from "@/lib/extensions";

export default function PricingPanel({
  extension,
  plans,
}: {
  extension: string;
  plans: Plan[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  // The license key: passed by the extension as ?lk=..., or generated here for
  // direct visitors (who then paste it into the extension to unlock).
  const [licenseKey, setLicenseKey] = useState<string>("");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("lk");
    setLicenseKey(fromUrl && fromUrl.trim() ? fromUrl.trim() : crypto.randomUUID());
  }, []);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  async function buy(plan: Plan) {
    setErr(null);
    if (!emailOk) {
      setErr("Enter the email address where we should send your license key.");
      return;
    }
    setBusy(plan.plan);
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
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="buy-field">
        <label htmlFor="license-email">
          Email for your license key
        </label>
        <input
          id="license-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby="license-email-hint"
        />
        <span id="license-email-hint" className="small muted">
          We email the key here right after payment so you can restore access on
          any browser. Used only for your license and support.
        </span>
      </div>

      <div className="plans">
        {plans.map((p) => (
          <div key={p.plan} className={`plan${p.highlight ? " highlight" : ""}`}>
            {p.highlight && <span className="badge">Best value</span>}
            <div className="plan-label">{p.label}</div>
            <div className="amount">{p.price}</div>
            <div className="cadence">{p.cadence}</div>
            <button
              className={`btn${p.highlight ? "" : " secondary"}`}
              style={{ width: "100%" }}
              onClick={() => buy(p)}
              disabled={busy !== null || !licenseKey || !emailOk}
            >
              {busy === p.plan
                ? "Opening checkout…"
                : p.recurring
                ? "Subscribe"
                : "Buy now"}
            </button>
          </div>
        ))}
      </div>

      {err && (
        <p className="small" style={{ color: "#e5484d" }}>
          {err}
        </p>
      )}

      <div className="notice small">
        Payments are securely processed by <strong>Creem</strong>, our
        Merchant of Record. One license unlocks all three premium CleanMySocial
        extensions after payment. See our{" "}
        <Link href="/refund">Refund Policy</Link> and{" "}
        <Link href="/terms">Terms</Link>.
      </div>
    </div>
  );
}
