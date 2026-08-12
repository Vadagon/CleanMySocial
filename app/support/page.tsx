import Link from "next/link";
import { PREMIUM_EXTENSIONS } from "@/lib/extensions";
import { ExtensionRow } from "../ExtensionBadge";
import { PRIVACY } from "@/lib/privacy";
import { SITE } from "@/lib/site";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "CleanMySocial support",
  description: "Installation, licensing, billing, privacy, and refund help directly from the CleanMySocial developer.",
  path: "/support",
});

export default function SupportPage() {
  return (
    <div className="page prose content-page support-page marketing-page">
      <header className="content-hero">
        <span className="eyebrow">Help when you need it</span>
        <h1>CleanMySocial Support</h1>
        <p>
          Help with installation, licensing, billing, privacy, and refunds—directly
          from the developer.
        </p>
      </header>

      <section className="support-contact-card">
        <div>
          <span className="support-contact-label">Email support</span>
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
          <p>We respond within three business days.</p>
        </div>
        <a className="btn" href={`mailto:${SITE.supportEmail}`}>Send an email</a>
      </section>

      <p>
        Include the extension name and, for purchase questions, the order
        number from your Creem receipt. CleanMySocial is developed, operated,
        and supported by {SITE.legalProvider}. CleanMySocial is a product name,
        not a separate company or legal entity.
      </p>

      <h2>Premium extensions</h2>
      <p>
        Buy these separately, as a discounted two-tool package, or together in
        the complete CleanMySocial set:
      </p>
      <ul className="ext-list">
        {PREMIUM_EXTENSIONS.map((extension) => (
          <li key={extension.slug}>
            <Link href={`/${extension.slug}`}>
              <ExtensionRow ext={extension} />
            </Link>
          </li>
        ))}
      </ul>

      <h2>Extension privacy notices</h2>
      <ul className="policy-links">
        {PRIVACY.map((policy) => (
          <li key={policy.slug}>
            <Link href={`/privacy/${policy.slug}`}>{policy.name}</Link>
          </li>
        ))}
      </ul>
      <p>
        See also the <Link href="/privacy">general Privacy Policy</Link>,{" "}
        <Link href="/terms">Terms of Service</Link>, and{" "}
        <Link href="/refund">Refund Policy</Link>.
      </p>

      <h2>Billing</h2>
      <p>
        Creem is the Merchant of Record and provides the receipt and buyer
        portal. Most CleanMySocial products are one-time lifetime purchases.
        Followers Tracker Pro also offers a $9 monthly subscription, which can
        be managed or canceled through the Creem buyer portal.
      </p>
    </div>
  );
}
