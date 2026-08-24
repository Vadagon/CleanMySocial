import { SITE } from "@/lib/site";
import type { Metadata } from "next";
import "../globals.css";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Refund Policy",
  description: "CleanMySocial's 14-day money-back guarantee and instructions for requesting a software purchase refund.",
  path: "/refund",
});

export default function RefundPage() {
  return (
    <div className="page prose content-page legal-page marketing-page">
      <h1>Refund Policy</h1>
      <p className="small muted">Effective: July 28, 2026</p>

      <p>
        CleanMySocial products are digital-software purchases that unlock the
        extension identified at checkout. Current products are available as a
        monthly subscription or a one-time lifetime purchase. We offer a
        <strong>14-day money-back guarantee</strong> from the original purchase
        date.
      </p>
      <p>
        The product is developed and provided by {SITE.legalProvider}.
        CleanMySocial is a product name, not a separate company or legal entity.
      </p>

      <h2>Eligibility</h2>
      <p>
        You may request a full refund within 14 days of purchase. Please tell us
        the reason so we can improve the product, though a reason is not required
        for the guarantee. Duplicate or unauthorized charges should be reported
        immediately and will be reviewed regardless of the 14-day period.
        Statutory consumer rights remain unaffected.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>{" "}
        from the address used at checkout and include the Creem order number
        shown on your receipt. We respond to refund and support requests within
        three business days.
      </p>

      <h2>Processing and access</h2>
      <p>
        Creem, our Merchant of Record, processes approved refunds to the original
        payment method. Bank posting times vary and commonly take 5–10 business
        days. A refund ends the associated CleanMySocial license and access to
        paid functionality.
      </p>
      <p>
        Canceling a monthly subscription stops future renewals, and access
        ordinarily remains available through the paid billing period.
      </p>

      <h2>Chargebacks</h2>
      <p>
        Please contact us first so we can resolve the issue promptly. Refunds and
        chargebacks for Creem transactions are administered through Creem in
        accordance with applicable law and Creem&rsquo;s buyer terms.
      </p>

      <h2>Contact</h2>
      <p>
        Developer and provider: {SITE.legalProvider}. Refund questions:{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
      </p>
    </div>
  );
}
