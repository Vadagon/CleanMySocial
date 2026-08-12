import Link from "next/link";
import { BUNDLE_PLAN, EXTENSIONS } from "@/lib/extensions";
import { ExtensionRow, Rating } from "./ExtensionBadge";

export default function AllToolsDealCard({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Link
        className="package-option-card package-option-card--all"
        href="/packages/all-tools"
        aria-label="View the all-tools package"
      >
        <span className="badge-soft">Best overall value</span>
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
            <strong>{BUNDLE_PLAN.price}</strong>
          </span>
          <span className="package-option-link">View package →</span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      className="bundle-card package-bundle-link"
      href="/packages/all-tools"
      aria-label="View the all-tools package"
    >
      <div>
        <h3>CleanMySocial — All {EXTENSIONS.length} Tools</h3>
        <ul className="ext-list">
          {EXTENSIONS.map((extension) => (
            <li key={extension.slug}>
              <ExtensionRow ext={extension} />
              <Rating ext={extension} linked={false} />
            </li>
          ))}
        </ul>
        <ul className="check-list">
          <li>All four CleanMySocial extensions</li>
          <li>Lifetime access and updates</li>
          <li>14-day money-back guarantee</li>
        </ul>
      </div>
      <div className="bundle-checkout">
        <span className="badge-soft">Best overall value</span>
        <span className="amount">{BUNDLE_PLAN.price}</span>
        <span className="muted">one-time payment</span>
        <span className="btn package-detail-button">View all-tools package</span>
      </div>
    </Link>
  );
}
