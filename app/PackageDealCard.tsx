import Link from "next/link";
import { getExtension } from "@/lib/extensions";
import type { Product } from "@/lib/products";
import { ExtensionRow } from "./ExtensionBadge";

export default function PackageDealCard({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  if (!product.slug) return null;

  if (compact) {
    return (
      <Link
        className="package-option-card"
        href={`/packages/${product.slug}`}
        aria-label={`View ${product.name} package details`}
      >
        <span className="badge-soft">2-tool package</span>
        <h3>{product.name}</h3>
        <span className="package-option-summary">
          2 extensions · lifetime access
        </span>
        <span className="package-option-includes-label">Includes</span>
        <ul className="package-option-includes">
          {product.entitlements.map((slug) => {
            const extension = getExtension(slug);
            return extension ? (
              <li key={slug}>
                <ExtensionRow ext={extension} size={22} compact />
              </li>
            ) : null;
          })}
        </ul>
        <span className="package-option-footer">
          <span className="package-option-price">
            <strong>{product.price}</strong>
            {product.compareAt ? <s>{product.compareAt}</s> : null}
          </span>
          <span className="package-option-link">View package →</span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      className="alacarte-card featured package-deal-card"
      href={`/packages/${product.slug}`}
      aria-label={`View ${product.name} package details`}
    >
      <span className="badge-soft">Two-tool discount</span>
      <h3>{product.name}</h3>
      <p className="muted small">{product.blurb}</p>
      <ul className="ext-list">
        {product.entitlements.map((slug) => {
          const extension = getExtension(slug);
          return extension ? (
            <li key={slug}>
              <ExtensionRow ext={extension} size={28} />
            </li>
          ) : null;
        })}
      </ul>
      <p className="alacarte-price">
        <strong>{product.price}</strong>
        {product.compareAt ? <s>{product.compareAt}</s> : null}
      </p>
      <span className="btn secondary package-detail-button">
        View package details
      </span>
    </Link>
  );
}
