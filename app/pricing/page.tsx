import Link from "next/link";
import PricingPanel from "../[extension]/PricingPanel";
import { BUNDLE_PLAN, PREMIUM_EXTENSIONS } from "@/lib/extensions";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Pricing",
  description: "One CleanMySocial purchase unlocks all three premium social cleanup extensions.",
};

export default function PricingPage() {
  return (
    <div className="page pricing-page">
      <div className="pricing-head">
        <span className="eyebrow">Simple lifetime pricing</span>
        <h1>All 3 premium extensions. One product.</h1>
        <p>
          Pay once and unlock the combined Facebook and Instagram cleaner,
          Messenger Cleaner, and Mass Unfriender. No subscription or add-ons.
        </p>
      </div>

      <div className="bundle-card">
        <div>
          <h2>CleanMySocial Lifetime</h2>
          <ul className="check-list">
            {PREMIUM_EXTENSIONS.map((extension) => <li key={extension.slug}>{extension.name}</li>)}
            <li>Lifetime access for one user</li>
            <li>Updates included</li>
            <li>14-day money-back guarantee</li>
          </ul>
        </div>
        <div className="bundle-checkout">
          <span className="amount">{BUNDLE_PLAN.price}</span>
          <span className="muted">one-time payment</span>
          <PricingPanel extension="cleanmysocial" plans={[BUNDLE_PLAN]} />
        </div>
      </div>

      <div className="notice small">
        Payments are processed by <strong>Creem</strong>, our Merchant of Record.
        Taxes may be added at checkout where required. Read our{" "}
        <Link href="/refund">Refund Policy</Link> and{" "}
        <Link href="/terms">Terms of Service</Link>, or{" "}
        <Link href="/support">contact support</Link>.
        <br />
        CleanMySocial is developed and provided by {SITE.legalProvider}.
      </div>
    </div>
  );
}
