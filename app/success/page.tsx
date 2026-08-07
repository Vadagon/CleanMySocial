import Link from "next/link";
import PurchaseEvent from "./PurchaseEvent";
import { getProduct } from "@/lib/products";

export const metadata = { title: "Thank you" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ lk?: string; product?: string }>;
}) {
  const { lk, product: productId } = await searchParams;
  const product = productId ? getProduct(productId) : undefined;

  return (
    <div className="page prose content-page success-page marketing-page">
      <PurchaseEvent licenseKey={lk} product={product} />
      <div className="success-mark" aria-hidden="true">✓</div>
      <h1>Thank you for your purchase!</h1>
      <p>
        Your payment was successful. Your CleanMySocial license unlocks the
        extension or package you purchased within a few moments, and a copy
        of your license key is on its way to the email address you gave at
        checkout.
      </p>

      {product ? (
        <p className="success-product">
          <span>Purchased</span>
          <strong>{product.name}</strong>
        </p>
      ) : null}

      {lk && (
        <div className="notice license-card">
          <p>
            <strong>Your license key</strong> — it&rsquo;s already saved in your
            extension. Keep a copy to restore access on another browser or
            computer:
          </p>
          <code className="license-key">{lk}</code>
        </div>
      )}

      <p className="muted">
        If your features don&rsquo;t unlock after a minute, reload the tab. If
        the email hasn&rsquo;t arrived after a few minutes, check your spam
        folder. Still
        stuck? Head to <Link href="/support">Support</Link> and we&rsquo;ll sort
        it out.
      </p>
      <p>
        <Link className="btn" href="/">
          Back to home
        </Link>
      </p>
    </div>
  );
}
