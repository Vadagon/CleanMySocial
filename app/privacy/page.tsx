import Link from "next/link";
import { PRIVACY } from "@/lib/privacy";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How CleanMySocial handles website, purchase, support, and browser-extension data.",
};

const sections = [
  ["collection", "What we process"],
  ["extensions", "Extension privacy"],
  ["use", "How data is used"],
  ["providers", "Service providers"],
  ["retention", "Retention & security"],
  ["rights", "Your rights"],
] as const;

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function PrivacyPage() {
  return (
    <div className="privacy-page marketing-page">
      <header className="privacy-hero">
        <div className="privacy-hero-copy">
          <span className="privacy-kicker">Privacy center</span>
          <h1>Your social data stays yours.</h1>
          <p>
            CleanMySocial tools do their work inside your browser. We built them
            to clean up your accounts without building a copy of your social
            life on our servers.
          </p>
          <div className="privacy-date">
            <span aria-hidden="true" /> Effective: August 4, 2026
          </div>
        </div>

        <div className="privacy-promise" aria-label="Our privacy commitments">
          <span className="privacy-promise-label">Our baseline</span>
          <ul>
            <li><CheckIcon /> We do not sell personal data</li>
            <li><CheckIcon /> We do not receive your messages</li>
            <li><CheckIcon /> We do not receive social credentials</li>
            <li><CheckIcon /> Extension actions run in your browser</li>
          </ul>
        </div>
      </header>

      <div className="privacy-shell">
        <aside className="privacy-nav" aria-label="Privacy policy contents">
          <span>On this page</span>
          <nav>
            {sections.map(([id, label]) => (
              <a href={`#${id}`} key={id}>{label}</a>
            ))}
          </nav>
          <a className="privacy-contact-link" href={`mailto:${SITE.supportEmail}`}>
            Privacy question <ArrowIcon />
          </a>
        </aside>

        <article className="privacy-content">
          <section className="privacy-intro">
            <p>
              This Privacy Policy explains how {SITE.legalProvider}, who develops
              and operates {SITE.name} (&ldquo;the developer,&rdquo; &ldquo;we,&rdquo; or
              &ldquo;us&rdquo;), handles information when you visit {SITE.domain}, buy
              an extension or package, use support, or use one of our browser
              extensions. CleanMySocial is a product name, not a separate company
              or legal entity.
            </p>
          </section>

          <section id="collection" className="privacy-section">
            <div className="privacy-section-heading">
              <span>01</span>
              <div><h2>What we process</h2><p>Only what is needed to run the business and support your purchase.</p></div>
            </div>
            <div className="privacy-data-grid">
              <div className="privacy-data-card">
                <span className="privacy-card-icon" aria-hidden="true">↗</span>
                <h3>Purchase &amp; license</h3>
                <p>Order identifier, product, transaction status, license identifier, and limited customer details supplied by our payment provider.</p>
              </div>
              <div className="privacy-data-card">
                <span className="privacy-card-icon" aria-hidden="true">@</span>
                <h3>License delivery email</h3>
                <p>The address entered at checkout, used to deliver your key, answer purchase questions, and send one follow-up about an unfinished checkout.</p>
              </div>
              <div className="privacy-data-card">
                <span className="privacy-card-icon" aria-hidden="true">?</span>
                <h3>Support</h3>
                <p>Your email address and anything you choose to include in a support request.</p>
              </div>
              <div className="privacy-data-card">
                <span className="privacy-card-icon" aria-hidden="true">◌</span>
                <h3>Basic website data</h3>
                <p>Hosting providers may process IP address, device or browser information, request time, and security logs.</p>
              </div>
            </div>
            <div className="privacy-note">
              <strong>No recurring marketing.</strong>
              <p>We do not add your checkout email to a mailing list. Reply to any message and we will delete the address.</p>
            </div>
          </section>

          <section id="extensions" className="privacy-section">
            <div className="privacy-section-heading">
              <span>02</span>
              <div><h2>Extension privacy</h2><p>See exactly what each tool can access and why.</p></div>
            </div>
            <div className="privacy-local-flow" aria-label="How extension data flows">
              <div><strong>Your account</strong><small>Facebook or Instagram</small></div>
              <span aria-hidden="true">→</span>
              <div className="active"><strong>Your browser</strong><small>Action runs locally</small></div>
              <span aria-hidden="true">↛</span>
              <div><strong>Our servers</strong><small>No social content</small></div>
            </div>
            <p>
              The extensions perform the actions you request inside your own
              logged-in Facebook or Instagram session. We do not receive or store
              your messages, message contents, friend list, social-account
              credentials, or the names of people you remove.
            </p>
            <div className="privacy-policy-list">
              {PRIVACY.map((policy) => (
                <Link href={`/privacy/${policy.slug}`} key={policy.slug}>
                  <span><strong>{policy.name}</strong><small>{policy.platform}</small></span>
                  <ArrowIcon />
                </Link>
              ))}
            </div>
          </section>

          <section id="use" className="privacy-section privacy-split-section">
            <div className="privacy-section-heading">
              <span>03</span>
              <div><h2>How we use information</h2></div>
            </div>
            <ul className="privacy-check-list">
              <li><CheckIcon /> Deliver and validate your license</li>
              <li><CheckIcon /> Complete purchases</li>
              <li><CheckIcon /> Prevent fraud and abuse</li>
              <li><CheckIcon /> Answer support requests</li>
              <li><CheckIcon /> Maintain service security</li>
              <li><CheckIcon /> Meet tax, accounting, and legal obligations</li>
            </ul>
          </section>

          <section id="providers" className="privacy-section">
            <div className="privacy-section-heading">
              <span>04</span>
              <div><h2>Service providers &amp; international processing</h2></div>
            </div>
            <p>
              Creem acts as Merchant of Record and processes checkout, payment,
              tax, invoice, refund, and buyer-portal data under its own privacy
              notice. Our hosting and data-storage providers process limited
              information on our behalf. These providers may process information
              in countries other than yours using appropriate legal safeguards.
              We do not sell personal data.
            </p>
          </section>

          <section id="retention" className="privacy-section">
            <div className="privacy-section-heading">
              <span>05</span>
              <div><h2>Retention &amp; security</h2></div>
            </div>
            <p>
              We retain purchase and accounting records for the period required
              by law, license records while needed to provide access, security
              logs for a limited operational period, and support correspondence
              as reasonably necessary to resolve the request. We use reasonable
              technical and organizational safeguards, but no online system is
              completely secure.
            </p>
          </section>

          <section id="rights" className="privacy-section">
            <div className="privacy-section-heading">
              <span>06</span>
              <div><h2>Your choices &amp; rights</h2></div>
            </div>
            <p>
              Depending on your location, you may request access, correction,
              deletion, restriction, portability, or objection, and may complain
              to your local data-protection authority. We may need to verify your
              identity before fulfilling a request.
            </p>
            <div className="privacy-rights-card">
              <div><span>Privacy contact</span><strong>{SITE.supportEmail}</strong></div>
              <a className="btn" href={`mailto:${SITE.supportEmail}`}>Send a request <ArrowIcon /></a>
            </div>
          </section>

          <section className="privacy-footnotes">
            <div>
              <h2>Children &amp; changes</h2>
              <p>CleanMySocial is not directed to children under 13. We may update this policy and will publish the revised effective date on this page.</p>
            </div>
            <div>
              <h2>Data controller</h2>
              <p>{SITE.legalProvider}. CleanMySocial is operated by the developer as an individual.</p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
