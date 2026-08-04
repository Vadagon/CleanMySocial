import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="page prose">
      <h1>Terms of Service</h1>
      <p className="small muted">Effective: August 4, 2026</p>

      <p>
        These Terms are an agreement between you and {SITE.legalProvider}, who
        develops and operates {SITE.name}, covering the {SITE.domain} website
        and the four CleanMySocial browser extensions (the
        &ldquo;Service&rdquo;). CleanMySocial is a product name, not a separate
        company or legal entity. By buying, installing, or using the Service,
        you agree to these Terms.
      </p>

      <h2>1. Product and eligibility</h2>
      <p>
        CleanMySocial includes Delete All Messages for Facebook &amp; Instagram,
        Messenger Cleaner – Delete All Facebook Messages, CleanMySocial Mass
        Unfriender, and the free DM Cleaner – Bulk Delete Instagram Messages.
        You must be legally able to enter this agreement and use the Service
        only with accounts you own or are authorized to manage.
      </p>

      <h2>2. License</h2>
      <p>
        A completed purchase grants one user a personal, non-exclusive,
        non-transferable, revocable license to use all three premium extensions for the
        stated lifetime term. &ldquo;Lifetime&rdquo; means the commercial
        lifetime of the product, subject to these Terms, platform changes,
        security needs, and applicable law. Updates are included while made
        available; no specific feature or update schedule is guaranteed.
      </p>

      <h2>3. Payments, delivery, and refunds</h2>
      <p>
        The price is shown before checkout in US dollars; taxes may be added
        where required. Creem acts as Merchant of Record, processes the payment,
        issues the receipt, and provides relevant buyer terms. Delivery is
        electronic: the license identifier is displayed after successful payment
        and unlocks the extensions. See our <Link href="/refund">Refund Policy</Link>.
      </p>

      <h2>4. Acceptable use</h2>
      <p>
        You may use the Service only to manage your own account lawfully. You
        must not use it for harassment, spam, unauthorized access, deception,
        scraping for resale, circumventing platform safeguards, infringing
        third-party rights, or violating law or a third-party platform&rsquo;s
        terms. You may not resell, sublicense, share, reverse engineer, modify,
        or interfere with the Service. The Service may not be used for
        sexually explicit or NSFW content or activity. We may suspend a license
        used fraudulently or in material breach of these Terms.
      </p>

      <h2>5. Third-party services</h2>
      <p>
        CleanMySocial is independent and is not affiliated with, endorsed by, or
        sponsored by Meta Platforms, Inc., Facebook, Messenger, Google, or
        Chrome. Third-party names and marks belong to their owners. Third-party
        websites can change without notice, which may temporarily or permanently
        affect extension functionality.
      </p>

      <h2>6. Privacy and intellectual property</h2>
      <p>
        Our <Link href="/privacy">Privacy Policy</Link> explains data handling.
        The Service, code, branding, and original materials remain our property
        or that of our licensors. Your account content remains yours and is
        processed locally as described in our privacy notices.
      </p>

      <h2>7. Disclaimer and liability</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as
        available.&rdquo; To the maximum extent permitted by law, we disclaim
        implied warranties and are not liable for indirect, incidental, special,
        or consequential loss. Our total liability relating to the Service will
        not exceed the amount you paid for CleanMySocial. Nothing in these Terms
        excludes rights or liability that cannot lawfully be excluded.
      </p>

      <h2>8. Changes and termination</h2>
      <p>
        We may update these Terms for legal, security, or product reasons by
        publishing a new effective date. You may stop using the Service at any
        time. Provisions that by nature should survive termination will survive.
      </p>

      <h2>9. Contact</h2>
      <p>
        Provider and developer: {SITE.legalProvider}. CleanMySocial is operated
        by the developer as an individual. Questions or notices:{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
      </p>
    </div>
  );
}
