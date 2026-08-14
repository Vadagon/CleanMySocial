import Link from "next/link";
import "../globals.css";
import "../seo-content.css";
import PricingPanel from "../[extension]/PricingPanel";
import {
  EXTENSIONS,
  planForProduct,
} from "@/lib/extensions";
import { COMBOS, SINGLES } from "@/lib/products";
import { ExtensionRow, UserCount } from "../ExtensionBadge";
import PackageDealCard from "../PackageDealCard";
import AllToolsDealCard from "../AllToolsDealCard";
import PaymentNotice from "../PaymentNotice";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

const DECISION_GUIDE: Record<string, { paid: string; bestFor: string }> = {
  "facebook-instagram-cleaner": {
    paid: "$12 lifetime",
    bestFor: "Messenger plus Instagram sent-message cleanup",
  },
  "facebook-messenger-cleaner": {
    paid: "$7 lifetime",
    bestFor: "Messenger-only inbox cleanup",
  },
  "mass-unfriender": {
    paid: "$9 lifetime",
    bestFor: "Reviewing and removing Facebook friends",
  },
  "instagram-followers-tracker": {
    paid: "$9 lifetime",
    bestFor: "Instagram unfollowers, bulk unfollow, and exports",
  },
};

export const metadata: Metadata = pageMetadata({
  title: "CleanMySocial pricing and lifetime licenses",
  description:
    "Compare CleanMySocial lifetime Chrome extension licenses, discounted two-tool packages, and the all-tools bundle.",
  path: "/pricing",
});

export default function PricingPage() {
  const orderedSingles = EXTENSIONS.flatMap((extension) => {
    const product = SINGLES.find((item) => item.entitlements[0] === extension.slug);
    return product ? [{ extension, product }] : [];
  });

  return (
    <div className="page pricing-page marketing-page">
      <div className="pricing-head">
        <span className="eyebrow">Simple pricing</span>
        <h1>Choose the cleanup tools you need.</h1>
        <p>
          Buy one premium extension, save with a two-tool package, or get every
          CleanMySocial tool for life.
        </p>
      </div>

      <section className="alacarte pricing-section" aria-labelledby="single-pricing-title">
        <span className="pricing-section-kicker">Individual extensions</span>
        <h2 id="single-pricing-title">Buy only what you need</h2>
        <p className="muted">
          Every premium extension is a one-time purchase with lifetime access.
        </p>
        <div className="alacarte-grid singles-grid">
          {orderedSingles.map(({ extension: ext, product }) => {
            return (
              <article className="alacarte-card single-product-card" key={product.id}>
                <ExtensionRow ext={ext} size={38} />
                <UserCount ext={ext} />
                <p className="muted small">{ext.tagline}</p>
                <p className="alacarte-price">
                  <strong>{product.price.replace(/\.00$/, "")}</strong>
                  <span>{product.billingType === "recurring" ? "per month" : "one time"}</span>
                </p>
                <PricingPanel
                  extension={ext.slug}
                  plans={[planForProduct(product)]}
                  compact
                />
                <Link className="product-detail-link" href={`/${ext.slug}`}>View extension details →</Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="pricing-comparison" aria-labelledby="pricing-comparison-title">
        <span className="pricing-section-kicker">Quick comparison</span>
        <h2 id="pricing-comparison-title">Not sure which tool fits the task?</h2>
        <p className="muted">
          Compare the free allowance and the job each extension is designed to handle.
        </p>
        <div className="pricing-table-wrap">
          <table>
            <caption className="sr-only">
              Free use, paid access, and recommended task for each CleanMySocial extension
            </caption>
            <thead>
              <tr>
                <th scope="col">Tool</th>
                <th scope="col">Included free use</th>
                <th scope="col">Paid access</th>
                <th scope="col">Best for</th>
              </tr>
            </thead>
            <tbody>
              {EXTENSIONS.map((extension) => {
                const guide = DECISION_GUIDE[extension.slug];
                return (
                  <tr key={extension.slug}>
                    <th scope="row"><Link href={`/${extension.slug}`}>{extension.name}</Link></th>
                    <td>{extension.freePlan.allowance}</td>
                    <td>{guide.paid}</td>
                    <td>{guide.bestFor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pricing-choice-note">
          <strong>Choosing between the two message cleaners?</strong>
          <p>
            Choose <Link href="/facebook-messenger-cleaner">Messenger Cleaner</Link> for
            Facebook Messenger only. Choose <Link href="/facebook-instagram-cleaner">Delete
            All Messages for Facebook &amp; Instagram</Link> when you also need to scan an
            Instagram conversation and unsend messages sent by your account.
          </p>
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
