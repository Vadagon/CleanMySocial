import Link from "next/link";
import { SITE } from "@/lib/site";

export default function PaymentNotice({
  variant = "notice",
}: {
  variant?: "notice" | "banner";
}) {
  const copy = (
    <>
      Payments are processed by <strong>Creem</strong>, our Merchant of Record.
      Taxes may be added at checkout where required. Read our{" "}
      <Link href="/refund">Refund Policy</Link> and{" "}
      <Link href="/terms">Terms of Service</Link>, or{" "}
      <Link href="/support">contact support</Link>.
      <br />
      CleanMySocial is developed and provided by {SITE.legalProvider}.
    </>
  );

  if (variant === "banner") {
    return (
      <div className="extension-payment-note">
        <img
          className="payment-creem-logo"
          src="/creem-wordmark.svg"
          alt=""
          aria-hidden="true"
        />
        <p>{copy}</p>
      </div>
    );
  }

  return <div className="notice small">{copy}</div>;
}

