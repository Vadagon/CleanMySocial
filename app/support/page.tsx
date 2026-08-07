import Link from "next/link";
import { FREE_EXTENSIONS, PREMIUM_EXTENSIONS } from "@/lib/extensions";
import { ExtensionRow } from "../ExtensionBadge";
import { PRIVACY } from "@/lib/privacy";
import { SITE } from "@/lib/site";

export const metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <div className="page prose">
      <h1>CleanMySocial Support</h1>
      <p>
        CleanMySocial is developed, operated, and supported by{" "}
        {SITE.legalProvider}. CleanMySocial is a product name, not a separate
        company or legal entity.
      </p>
      <p>
        For installation, licensing, billing, privacy, or refund help, email{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. Include
        the extension name and, for purchase questions, the order number from
        your Creem receipt. We respond within three business days.
      </p>

      <h2>What your purchase includes</h2>
      <ul className="ext-list">
        {PREMIUM_EXTENSIONS.map((extension) => (
          <li key={extension.slug}>
            <Link href={`/${extension.slug}`}>
              <ExtensionRow ext={extension} />
            </Link>
          </li>
        ))}
      </ul>
      <h2>Tools that need no license key</h2>
      <p>These work without a purchase:</p>
      <ul className="ext-list">
        {FREE_EXTENSIONS.map((extension) => (
          <li key={extension.slug}>
            <Link href={`/${extension.slug}`}>
              <ExtensionRow ext={extension} />
            </Link>
          </li>
        ))}
      </ul>

      <h2>Extension privacy notices</h2>
      <ul>
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
        CleanMySocial is a one-time purchase. Creem is the Merchant of Record
        and provides the receipt and buyer portal. There is no recurring
        subscription to cancel.
      </p>
    </div>
  );
}
