import Link from "next/link";
import PricingPanel from "../[extension]/PricingPanel";
import {
  EXTENSIONS,
  getExtension,
  planForProduct,
} from "@/lib/extensions";
import { COMBOS, SINGLES } from "@/lib/products";
import { ExtensionRow } from "../ExtensionBadge";
import PackageDealCard from "../PackageDealCard";
import AllToolsDealCard from "../AllToolsDealCard";
import PaymentNotice from "../PaymentNotice";

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
            <PackageDealCard product={product} key={product.id} />
          ))}
        </div>
      </section>

      <section className="bundle-pricing-section" aria-labelledby="all-tools-title">
        <div className="bundle-section-heading">
          <span className="pricing-section-kicker">Want everything?</span>
          <h2 id="all-tools-title">Get all {EXTENSIONS.length} CleanMySocial tools</h2>
          <p className="muted">The complete set remains the best overall value.</p>
        </div>
        <AllToolsDealCard />
      </section>

      <PaymentNotice />
    </div>
  );
}
