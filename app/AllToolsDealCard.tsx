import Link from "next/link";
import { BUNDLE_PLAN, EXTENSIONS } from "@/lib/extensions";
import { ExtensionRow, Rating } from "./ExtensionBadge";

export default function AllToolsDealCard() {
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
          <li>All premium extensions plus our free tool</li>
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
