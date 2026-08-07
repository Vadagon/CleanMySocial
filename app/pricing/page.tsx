import Link from "next/link";
import PricingPanel from "../[extension]/PricingPanel";
import {
  BUNDLE_PLAN,
  EXTENSIONS,
  getExtension,
  planForProduct,
} from "@/lib/extensions";
import { COMBOS, SINGLES } from "@/lib/products";
import { ExtensionRow, Rating } from "../ExtensionBadge";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Pricing",
  description:
    "Buy a CleanMySocial extension separately, save on a two-tool package, or get every tool for life.",
};

export default function PricingPage() {
  return (
    <div className="page pricing-page marketing-page">
      <div className="pricing-head">
        <span className="eyebrow">Simple lifetime pricing</span>
        <h1>Choose the cleanup tools you need.</h1>
        <p>
          Buy one premium extension, save with a two-tool package, or get every
          CleanMySocial tool. Every paid option is a one-time purchase.
        </p>
      </div>

      <section className="alacarte pricing-section" aria-labelledby="single-pricing-title">
        <span className="pricing-section-kicker">Individual extensions</span>
        <h2 id="single-pricing-title">Buy only what you need</h2>
        <p className="muted">
          Each license unlocks one premium extension for life. The other two
          CleanMySocial tools are free and need no license.
        </p>
        <div className="alacarte-grid singles-grid">
          {SINGLES.map((product) => {
            const ext = getExtension(product.entitlements[0]);
            return (
              <article className="alacarte-card single-product-card" key={product.id}>
                {ext ? <ExtensionRow ext={ext} size={38} /> : <h3>{product.name}</h3>}
                {ext ? <p className="muted small">{ext.tagline}</p> : null}
                <p className="alacarte-price">
                  <strong>{product.price}</strong>
                  <span>one time</span>
                </p>
                <PricingPanel
                  extension={ext?.slug || "cleanmysocial"}
                  plans={[planForProduct(product)]}
                  compact
                />
                {ext ? <Link className="product-detail-link" href={`/${ext.slug}`}>View extension details →</Link> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="alacarte pricing-section combo-pricing" aria-labelledby="combo-pricing-title">
        <span className="pricing-section-kicker">Discounted packages</span>
        <h2 id="combo-pricing-title">Get two extensions for less</h2>
        <p className="muted">
          Choose a focused pair and use one license key for both included tools.
        </p>
        <div className="alacarte-grid combo-grid">
          {COMBOS.map((product) => (
            <article className="alacarte-card featured" key={product.id}>
              <span className="badge-soft">Two-tool discount</span>
              <h3>{product.name}</h3>
              <p className="muted small">{product.blurb}</p>
              <ul className="ext-list">
                {product.entitlements.map((slug) => {
                  const ext = getExtension(slug);
                  return ext ? (
                    <li key={slug}>
                      <ExtensionRow ext={ext} size={28} />
                    </li>
                  ) : null;
                })}
              </ul>
              <p className="alacarte-price">
                <strong>{product.price}</strong>
                {product.compareAt ? <s>{product.compareAt}</s> : null}
              </p>
              <PricingPanel
                extension="cleanmysocial-package"
                plans={[planForProduct(product)]}
                compact
              />
            </article>
          ))}
        </div>
      </section>

      <section className="bundle-pricing-section" aria-labelledby="all-tools-title">
        <div className="bundle-section-heading">
          <span className="pricing-section-kicker">Want everything?</span>
          <h2 id="all-tools-title">Get all {EXTENSIONS.length} CleanMySocial tools</h2>
          <p className="muted">The complete set remains the best overall value.</p>
        </div>
        <div className="bundle-card">
          <div>
            <h3>CleanMySocial — All {EXTENSIONS.length} Tools</h3>
            <ul className="ext-list">
              {EXTENSIONS.map((extension) => (
                <li key={extension.slug}>
                  <ExtensionRow ext={extension} />
                  <Rating ext={extension} />
                </li>
              ))}
            </ul>
            <ul className="check-list">
              <li>All premium extensions plus both free tools</li>
              <li>Lifetime access and updates</li>
              <li>14-day money-back guarantee</li>
            </ul>
          </div>
          <div className="bundle-checkout">
            <span className="badge-soft">Best overall value</span>
            <span className="amount">{BUNDLE_PLAN.price}</span>
            <span className="muted">one-time payment</span>
            <PricingPanel extension="cleanmysocial-all-tools" plans={[BUNDLE_PLAN]} />
          </div>
        </div>
      </section>

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
