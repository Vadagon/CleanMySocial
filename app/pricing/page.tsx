import Link from "next/link";
import PricingPanel from "../[extension]/PricingPanel";
import { BUNDLE_PLAN, EXTENSIONS, getExtension } from "@/lib/extensions";
import type { Plan } from "@/lib/extensions";
import { COMBOS, SELL_INDIVIDUAL, SINGLES } from "@/lib/products";
import type { Product } from "@/lib/products";
import { ExtensionRow, Rating } from "../ExtensionBadge";

/** Adapt a Creem product to the shape PricingPanel already speaks. */
function planFor(product: Product): Plan {
  return {
    plan: product.kind,
    label: product.name,
    productId: product.id,
    price: product.price,
    cadence: "one-time payment · lifetime access",
    access: "lifetime",
    recurring: false,
  };
}
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Pricing",
  description: "One CleanMySocial purchase unlocks all five social cleanup extensions, for life.",
};

export default function PricingPage() {
  return (
    <div className="page pricing-page marketing-page">
      <div className="pricing-head">
        <span className="eyebrow">Simple lifetime pricing</span>
        <h1>All {EXTENSIONS.length} extensions. One product.</h1>
        <p>
          Pay once and get every tool we make, for life. No subscription, no
          add-ons, no per-tool upgrades.
        </p>
      </div>

      <div className="bundle-card">
        <div>
          <h2>CleanMySocial Lifetime</h2>
          <ul className="ext-list">
            {EXTENSIONS.map((extension) => (
              <li key={extension.slug}>
                <ExtensionRow ext={extension} />
                <Rating ext={extension} />
              </li>
            ))}
          </ul>
          <ul className="check-list">
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

      {SELL_INDIVIDUAL ? (
        <section className="alacarte" aria-label="Individual and combo pricing">
          <h2>Only need one thing?</h2>
          <p className="muted">
            Buy a single tool, or the pair people usually buy together. Every
            purchase is one-time, with the same 14-day guarantee.
          </p>

          <div className="alacarte-grid">
            {COMBOS.map((product) => (
              <article className="alacarte-card featured" key={product.id}>
                <span className="badge-soft">Often bought together</span>
                <h3>{product.name}</h3>
                <p className="muted small">{product.blurb}</p>
                <ul className="ext-list">
                  {product.entitlements.map((slug) => {
                    const ext = getExtension(slug);
                    return ext ? (
                      <li key={slug}>
                        <ExtensionRow ext={ext} size={26} />
                      </li>
                    ) : null;
                  })}
                </ul>
                <p className="alacarte-price">
                  <strong>{product.price}</strong>
                  {product.compareAt ? <s>{product.compareAt}</s> : null}
                </p>
                <PricingPanel
                  extension="cleanmysocial"
                  plans={[planFor(product)]}
                  compact
                />
              </article>
            ))}

            {SINGLES.map((product) => {
              const ext = getExtension(product.entitlements[0]);
              return (
                <article className="alacarte-card" key={product.id}>
                  {ext ? <ExtensionRow ext={ext} size={32} /> : <h3>{product.name}</h3>}
                  <p className="alacarte-price">
                    <strong>{product.price}</strong>
                  </p>
                  <PricingPanel
                    extension="cleanmysocial"
                    plans={[planFor(product)]}
                    compact
                  />
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

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
