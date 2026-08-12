import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "../JsonLd";
import { EXTENSIONS } from "@/lib/extensions";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "About CleanMySocial and its developer",
  description:
    "Meet the independent developer behind CleanMySocial and learn how its Facebook and Instagram Chrome extensions are maintained and supported.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="page about-page marketing-page">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": `${SITE.url}/#developer`,
            name: SITE.legalName,
            url: absoluteUrl("/about"),
            email: SITE.supportEmail,
            jobTitle: "Independent software developer",
            brand: {
              "@type": "Brand",
              "@id": `${SITE.url}/#brand`,
              name: SITE.name,
              url: SITE.url,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: `About ${SITE.name}`,
            url: absoluteUrl("/about"),
            mainEntity: { "@id": `${SITE.url}/#developer` },
          },
        ]}
      />

      <header className="content-hero trust-hero">
        <span className="eyebrow">Independent software</span>
        <h1>CleanMySocial is built and supported by one developer.</h1>
        <p>
          {SITE.name} is a product name for a set of focused Chrome extensions.
          It is developed, operated, and supported by {SITE.legalName} as an
          individual software developer.
        </p>
      </header>

      <section className="trust-principles" aria-labelledby="trust-principles-title">
        <div>
          <span>01</span>
          <h2 id="trust-principles-title">Narrow tools</h2>
          <p>Each extension is designed around a specific Facebook, Messenger, or Instagram cleanup task.</p>
        </div>
        <div>
          <span>02</span>
          <h2>Local social data</h2>
          <p>Social-account actions and lists are handled in the user&rsquo;s browser as described in each extension privacy notice.</p>
        </div>
        <div>
          <span>03</span>
          <h2>Direct support</h2>
          <p>Installation, licensing, privacy, and refund questions go directly to the developer.</p>
        </div>
      </section>

      <div className="trust-content-grid">
        <section className="trust-prose">
          <span className="pricing-section-kicker">Operator and provider</span>
          <h2>Who is responsible for CleanMySocial?</h2>
          <p>
            {SITE.legalName} is the developer, website operator, software
            provider, and support contact identified in the CleanMySocial terms
            and policies. CleanMySocial is not a separate company or legal entity.
          </p>
          <p>
            Some older Chrome Web Store surfaces may still display legacy
            marketplace developer or publisher metadata. Those labels do not
            identify a separate operator of this website. The authoritative
            provider information for current CleanMySocial sales and support is
            published here and in the <Link href="/terms">Terms of Service</Link>.
          </p>

          <h2>Independence from social platforms</h2>
          <p>
            CleanMySocial is independent. It is not affiliated with, endorsed
            by, or sponsored by Meta Platforms, Facebook, Messenger, Instagram,
            Google, or Chrome. Third-party names and marks belong to their owners.
          </p>

          <h2>How maintenance works</h2>
          <p>
            Facebook and Instagram change their interfaces and internal web
            behavior over time. The extensions are maintained in response to
            those changes, product reports, and compatibility testing. Public
            release information is recorded in the <Link href="/changelog">changelog</Link>.
          </p>

          <h2>Contact</h2>
          <p>
            Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> for
            product, licensing, privacy, or refund questions. The normal response
            target is within three business days.
          </p>
        </section>

        <aside className="official-products" aria-label="Official CleanMySocial products">
          <span className="pricing-section-kicker">Official products</span>
          <h2>Four Chrome extensions</h2>
          <ul>
            {EXTENSIONS.map((extension) => (
              <li key={extension.slug}>
                <Link href={`/${extension.slug}`}>
                  <strong>{extension.name}</strong>
                  <small>Store ID: {extension.storeId}</small>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
