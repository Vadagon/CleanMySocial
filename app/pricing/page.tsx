import Link from "next/link";
import "../globals.css";
import "../seo-content.css";
import PricingPanel from "../[extension]/PricingPanel";
import { EXTENSIONS } from "@/lib/extensions";
import { ExtensionRow, UserCount } from "../ExtensionBadge";
import PaymentNotice from "../PaymentNotice";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

/** One line on who each tool is for. Prices come from the catalogue itself. */
const BEST_FOR: Record<string, string> = {
  "facebook-instagram-cleaner": "Messenger plus Instagram sent-message cleanup",
  "facebook-messenger-cleaner": "Messenger-only inbox cleanup",
  "mass-unfriender": "Reviewing and removing Facebook friends",
  "instagram-dm-cleaner": "Bulk-unsending messages from one Instagram conversation",
  "instagram-followers-tracker": "Instagram unfollowers, bulk unfollow, and exports",
  "reddit-cleaner": "Deleting your own Reddit posts and comments",
  cleanerx: "Clearing posts, likes, reposts and follows on X",
  "facebook-activity-cleaner": "Emptying the Facebook Activity Log",
  cleanfeed: "Hiding the feed itself, on six networks",
};

/** "$4.99 / 3 days · $9.99/mo · $29.99 lifetime", from the catalogue. */
function priceSummary(extension: { plans: { price: string; access: string }[] }) {
  if (extension.plans.length === 0) return "Free — nothing to buy";
  const hot = extension.plans.find((plan) => plan.access === "pass");
  const monthly = extension.plans.find((plan) => plan.access === "subscription");
  const lifetime = extension.plans.find((plan) => plan.access === "lifetime");
  const trim = (value: string) => value.replace(/\.00$/, "");
  return [
    hot ? `${trim(hot.price)} / 3 days` : null,
    monthly ? `${trim(monthly.price)}/mo` : null,
    lifetime ? `${trim(lifetime.price)} lifetime` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export const metadata: Metadata = pageMetadata({
  title: "CleanMySocial pricing: 3-day, monthly, and lifetime access",
  description:
    "What each CleanMySocial extension costs, what its free tier includes, and which one fits the job — nine Chrome extensions, sold separately.",
  path: "/pricing",
});

export default function PricingPage() {
  const paidExtensions = EXTENSIONS.filter((extension) => extension.plans.length > 0);

  return (
    <div className="page pricing-page marketing-page">
      <div className="pricing-head">
        <span className="eyebrow">Simple pricing</span>
        <h1>Choose the cleanup tools you need.</h1>
        <p>
          Every premium extension is sold separately. Choose a three-day pass,
          continue month to month, or pay once for lifetime access.
        </p>
      </div>

      <section className="alacarte pricing-section" aria-labelledby="single-pricing-title">
        <span className="pricing-section-kicker">Individual extensions</span>
        <h2 id="single-pricing-title">Buy only what you need</h2>
        <p className="muted">
          Monthly is recommended. A three-day pass is available for a quick
          cleanup, while Lifetime gives permanent access without a subscription.
        </p>
        <div className="alacarte-grid singles-grid">
          {paidExtensions.map((ext) => {
            return (
              <article className="alacarte-card single-product-card" key={ext.slug}>
                <ExtensionRow ext={ext} size={38} />
                <UserCount ext={ext} />
                <p className="muted small">{ext.tagline}</p>
                <p className="alacarte-price">
                  <strong>{priceSummary(ext)}</strong>
                </p>
                <PricingPanel
                  extension={ext.slug}
                  plans={ext.plans}
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
          Compare the included access and the job each extension is designed to handle.
        </p>
        <div className="pricing-table-wrap">
          <table>
            <caption className="sr-only">
              Free use, paid access, and recommended task for each CleanMySocial extension
            </caption>
            <thead>
              <tr>
                <th scope="col">Tool</th>
                <th scope="col">Included access</th>
                <th scope="col">Paid access</th>
                <th scope="col">Best for</th>
              </tr>
            </thead>
            <tbody>
              {EXTENSIONS.map((extension) => {
                const bestFor = BEST_FOR[extension.slug] ?? extension.tagline;
                return (
                  <tr key={extension.slug}>
                    <th scope="row"><Link href={`/${extension.slug}`}>{extension.name}</Link></th>
                    <td>{extension.freePlan?.allowance || "Paid lifetime access"}</td>
                    <td>{priceSummary(extension)}</td>
                    <td>{bestFor}</td>
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

      <section className="pricing-section" aria-labelledby="free-tool-title">
        <span className="pricing-section-kicker">Free forever · no limits</span>
        <h2 id="free-tool-title">CleanFeed hides the feed itself</h2>
        <p className="muted">
          Every tool above cleans what is already on your account. CleanFeed stops
          the feed pulling you back in — on six networks. No licence key, no
          allowance to run out, nothing to buy later.
        </p>
        <Link className="btn" href="/cleanfeed">
          See CleanFeed →
        </Link>
      </section>

      <PaymentNotice />
    </div>
  );
}
