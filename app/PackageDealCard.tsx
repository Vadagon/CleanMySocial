import Link from "next/link";
import { getExtension } from "@/lib/extensions";
import type { Product } from "@/lib/products";
import { ExtensionRow } from "./ExtensionBadge";

export default function PackageDealCard({ product }: { product: Product }) {
  if (!product.slug) return null;

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
