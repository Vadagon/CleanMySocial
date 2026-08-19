import Link from "next/link";
import "../globals.css";
import LicenseConfirmation from "./LicenseConfirmation";
import LicenseKeyCard from "./LicenseKeyCard";
import { getProduct } from "@/lib/products";

export const metadata = {
  title: "Thank you",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    product?: string;
    request_id?: string;
    product_id?: string;
    checkout_id?: string;
    signature?: string;
  }>;
}) {
  const params = await searchParams;
  // Creem echoes the key back as request_id. Never read ?lk here: it is the
  // extension's own identity, which is deliberately not what was purchased.
  const lk = params.request_id;
  const productId = params.product_id || params.product;
  const product = productId ? getProduct(productId) : undefined;
  const canConfirm = Boolean(
    params.request_id && params.product_id && params.checkout_id && params.signature,
  );

  return (
    <div className="page prose content-page success-page marketing-page">
      <div className="success-mark" aria-hidden="true">✓</div>
      <h1>Thank you for your purchase!</h1>
      <p>
        Creem has returned you from checkout. We&rsquo;re activating the extension
        or package you purchased and delivering a copy of the key to the email
        address you gave at checkout.
      </p>
      <LicenseConfirmation enabled={canConfirm} licenseKey={lk} product={product} />

      {product ? (
        <p className="success-product">
          <span>Purchased</span>
          <strong>{product.name}</strong>
        </p>
      ) : null}

      {lk && <LicenseKeyCard licenseKey={lk} />}

      <p className="muted">
        If the key above doesn&rsquo;t unlock the extension, make sure you pasted
        it with no extra spaces and that you&rsquo;re unlocking the extension you
        actually bought. If the email hasn&rsquo;t arrived after a few minutes,
        check your spam folder. Still stuck? Head to{" "}
        <Link href="/support">Support</Link> with the key above and we&rsquo;ll
        sort it out.
      </p>
      <p>
        <Link className="btn" href="/">
          Back to home
        </Link>
      </p>
    </div>
  );
}
