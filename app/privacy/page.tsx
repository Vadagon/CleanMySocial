import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="page prose">
      <h1>Privacy Policy</h1>
      <p className="small muted">Effective: August 4, 2026</p>

      <p>
        This Privacy Policy explains how {SITE.legalProvider}, who develops and
        operates {SITE.name} (&ldquo;the developer,&rdquo; &ldquo;we,&rdquo; or
        &ldquo;us&rdquo;), handles information when you visit {SITE.domain}, buy
        the CleanMySocial bundle, use our support service, or use one of our
        browser extensions. CleanMySocial is a product name, not a separate
        company or legal entity.
      </p>

      <h2>Information we process</h2>
      <ul>
        <li>
          <strong>Purchase and license data:</strong> order identifier, product,
          transaction status, license identifier, and limited customer details
          supplied by our payment provider.
        </li>
        <li>
          <strong>Support data:</strong> your email address and anything you
          include in a support request.
        </li>
        <li>
          <strong>Basic website data:</strong> hosting providers may process IP
          address, device/browser information, request time, and security logs.
        </li>
      </ul>

      <h2>What the extensions do not send us</h2>
      <p>
        The extensions perform the actions you request locally in your browser,
        within your own logged-in Facebook or Instagram session. We do not
        receive or store your messages, message contents, Facebook friend list,
        social-account credentials, or the names of people you remove. See each extension&rsquo;s{" "}
        <Link href="/support">specific privacy notice</Link> for its permissions.
      </p>

      <h2>Why we use information</h2>
      <p>
        We process information to deliver and validate your license, complete
        purchases, prevent fraud and abuse, answer support requests, maintain
        security, and comply with tax, accounting, and legal obligations.
      </p>

      <h2>Service providers and international processing</h2>
      <p>
        Creem acts as Merchant of Record and processes checkout, payment, tax,
        invoice, refund, and buyer-portal data under its own privacy notice. Our
        hosting and data-storage providers process limited information on our
        behalf. These providers may process information in countries other than
        yours using appropriate legal safeguards. We do not sell personal data.
      </p>

      <h2>Retention and security</h2>
      <p>
        We retain purchase and accounting records for the period required by
        law, license records while needed to provide access, security logs for a
        limited operational period, and support correspondence as reasonably
        necessary to resolve the request. We use reasonable technical and
        organizational safeguards, but no online system is completely secure.
      </p>

      <h2>Your choices and rights</h2>
      <p>
        Depending on your location, you may request access, correction, deletion,
        restriction, portability, or objection, and may complain to your local
        data-protection authority. Email{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. We may
        need to verify your identity before fulfilling a request.
      </p>

      <h2>Children and changes</h2>
      <p>
        CleanMySocial is not directed to children under 13. We may update this
        policy and will publish the revised effective date on this page.
      </p>

      <h2>Contact</h2>
      <p>
        Data controller and developer: {SITE.legalProvider}. CleanMySocial is
        operated by the developer as an individual. Email:{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
      </p>
    </div>
  );
}
