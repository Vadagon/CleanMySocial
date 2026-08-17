import Link from "next/link";
import { BUNDLE_PLAN, EXTENSIONS } from "@/lib/extensions";
import { ExtensionRow, UserCount } from "./ExtensionBadge";

export default function AllToolsDealCard({ compact = false }: { compact?: boolean }) {
  const bundlePrice = Number(BUNDLE_PLAN.price.replace(/[^0-9.]/g, ""));
  const comparePrice = Number(BUNDLE_PLAN.compareAt?.replace(/[^0-9.]/g, ""));
  const savings = comparePrice > bundlePrice ? comparePrice - bundlePrice : 0;
  const savingsLabel = savings ? `Save $${savings}` : "Best overall value";
  const displayedPrice = BUNDLE_PLAN.price.replace(/\.00$/, "");
  const displayedCompareAt = BUNDLE_PLAN.compareAt?.replace(/\.00$/, "");

  if (compact) {
    return (
      <Link
        className="package-option-card package-option-card--all"
        href="/packages/all-tools"
        aria-label="View the all-tools package"
      >
        <span className="badge-soft">{savingsLabel}</span>
        <h3>CleanMySocial — All {EXTENSIONS.length} Tools</h3>
        <span className="package-option-summary">
          Every extension · lifetime access
        </span>
        <span className="package-option-includes-label">Includes</span>
        <ul className="package-option-includes">
          {EXTENSIONS.map((extension) => (
            <li key={extension.slug}>
              <ExtensionRow ext={extension} size={22} compact />
            </li>
          ))}
        </ul>
        <span className="package-option-footer">
          <span className="package-option-price">
            <strong>{displayedPrice}</strong>
            {displayedCompareAt ? <s>{displayedCompareAt}</s> : null}
          </span>
          <span className="package-option-link">View package →</span>
        </span>
      </Link>
    );
  }

  return (
    <article
      className="bundle-card package-bundle-link"
      aria-label="View the all-tools package"
    >
      <div>
        <h3><Link href="/packages/all-tools">CleanMySocial — All {EXTENSIONS.length} Tools</Link></h3>
        <ul className="ext-list">
          {EXTENSIONS.map((extension) => (
            <li key={extension.slug}>
              <ExtensionRow ext={extension} />
              <UserCount ext={extension} />
            </li>
          ))}
        </ul>
        <ul className="check-list">
          <li>All five CleanMySocial extensions</li>
          <li>Lifetime access and updates</li>
          <li>14-day money-back guarantee</li>
        </ul>
      </div>
      <div className="bundle-checkout">
        <span className="badge-soft">{savingsLabel}</span>
        <span className="amount">{displayedPrice}</span>
        <span className="muted">
          {displayedCompareAt ? <><s>{displayedCompareAt}</s> separately · </> : null}
          one-time payment
        </span>
        <Link className="btn package-detail-button" href="/packages/all-tools">View all-tools package</Link>
      </div>
    </article>
  );
}
