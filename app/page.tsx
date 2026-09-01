import Link from "next/link";
import Image from "next/image";
import { getExtensions, getPremiumExtensions, localizeExtension, type Extension } from "@/lib/extensions";
import { NETWORKS, extensionsForNetwork, networkSummary } from "@/lib/networks";
import NetworkPicker from "./NetworkPicker";
import { UserCount } from "./ExtensionBadge";
import ToolChooser from "./ToolChooser";
import type { Metadata } from "next";
import JsonLd from "./JsonLd";
import { DEVELOPER_REF, absoluteUrl, pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";
import { localePath } from "@/lib/locale-path";
import { localeAlternates } from "@/lib/locale-path";
import "./home.css";

export const metadata: Metadata = pageMetadata({
  title: "Chrome extensions for cleaning Facebook and Instagram",
  description:
    "Clean Messenger conversations, remove Facebook friends in bulk, and track Instagram unfollowers with privacy-conscious Chrome extensions.",
  path: "/",
  languages: localeAlternates("/"),
});

function ToolCard({ extension, locale }: { extension: Extension; locale: Locale }) {
  const href = localePath(locale, `/${extension.slug}`);
  return (
    <article className="tool">
      <Link className="tool-icon-link" href={href} aria-label={`View ${extension.name}`}>
        <Image
          className="tool-icon"
          src={extension.icon}
          alt=""
          width={88}
          height={88}
        />
      </Link>
      <Link className="tool-name" href={href}>{extension.name}</Link>
      <UserCount ext={extension} />
      <Link className="tool-learn" href={href}>
        See details
      </Link>
    </article>
  );
}

export function HomeContent({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const extensions = getExtensions(locale);
  const premiumExtensions = getPremiumExtensions(locale);
  return (
    <div className="home marketing-page">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE.name,
            url: SITE.url,
            description: SITE.description,
            publisher: DEVELOPER_REF,
          },
          {
            "@context": "https://schema.org",
            "@type": "Brand",
            name: SITE.name,
            url: SITE.url,
            description: SITE.description,
          },
          {
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": `${SITE.url}/#developer`,
            name: SITE.legalName,
            url: SITE.url,
            email: SITE.supportEmail,
            jobTitle: "Independent software developer",
            brand: { "@type": "Brand", name: SITE.name },
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "CleanMySocial Chrome extensions",
            itemListElement: extensions.map((extension, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: extension.name,
              url: absoluteUrl(localePath(locale, `/${extension.slug}`)),
            })),
          },
        ]}
      />
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="eyebrow">Focused tools for Facebook and Instagram</span>
          <h1>Clean up the social accounts you actually use.</h1>
          <p>
            Clear old conversations, trim a crowded friends list, remove sent
            messages, and understand your Instagram following—without doing it
            all one click at a time.
          </p>
          <div className="hero-actions">
            <a className="btn" href="#extensions">Choose your cleanup task</a>
            <Link className="home-text-link" href="/pricing">
              Compare products and pricing →
            </Link>
          </div>
          <p className="hero-note">
            Runs in Chrome · You stay in control · Free and paid options
          </p>
        </div>

        <NetworkPicker
          locale={locale}
          networks={NETWORKS.map((network) => {
            const tools = extensionsForNetwork(network).map((extension) => localizeExtension(extension, locale));
            return {
              ...network,
              summary: networkSummary(network),
              tools: tools.map(({ slug, shortName, tagline, icon }) => ({
                slug,
                shortName,
                tagline,
                icon,
              })),
              freeSlugs: tools.filter((tool) => tool.plans.length === 0).map((tool) => tool.slug),
            };
          })}
        />
      </section>

      <section className="home-value-strip" aria-label="Why CleanMySocial">
        <span><strong>Focused</strong>One job per extension</span>
        <span><strong>Controlled</strong>You choose what changes</span>
        <span><strong>Browser-based</strong>No account handoff</span>
      </section>

      <section id="extensions" className="home-products" aria-labelledby="home-products-title">
        <header className="home-section-heading">
          <div>
            <span className="eyebrow">Choose by task</span>
            <h2 id="home-products-title">Start with what you want to clean.</h2>
            <p>
              Every card opens a full product page with screenshots and details
              before you install or buy.
            </p>
          </div>
          <Link href="/pricing">Compare every tool and price →</Link>
        </header>

        <div className="home-tool-group">
          <div className="home-tool-group-heading">
            <h3>Premium cleanup tools</h3>
            <span>Monthly or lifetime · sold separately</span>
          </div>
          <div className="tools tools-premium">
            {premiumExtensions.map((extension) => (
              <ToolCard extension={extension} locale={locale} key={extension.slug} />
            ))}
          </div>
        </div>

      </section>

      <ToolChooser headingId="home-chooser-title" locale={locale} />

      <section className="home-closing">
        <div>
          <span className="eyebrow">Need more than one?</span>
          <h2>Compare every tool and what it costs.</h2>
        </div>
        <Link className="btn secondary" href="/pricing">
          Explore pricing
        </Link>
      </section>

      <section className="home-closing" aria-labelledby="home-guides-title">
        <div>
          <span className="eyebrow">Not ready to install?</span>
          <h2 id="home-guides-title">Read the cleanup guides first.</h2>
          <p>What each platform&rsquo;s delete button actually does, what it cannot reach, and whether you need an extension at all.</p>
        </div>
        <Link className="btn secondary" href="/blog">
          Browse guides
        </Link>
      </section>

      <section className="home-closing home-trust-closing" aria-labelledby="home-developer-title">
        <div>
          <span className="eyebrow">Built independently</span>
          <h2 id="home-developer-title">Know who develops and supports the tools.</h2>
          <p>
            CleanMySocial is built and supported by {SITE.legalName}. Every
            extension is sold by the developer directly, with Creem as Merchant
            of Record handling payment, invoices and refunds.
          </p>
        </div>
        <Link className="btn secondary" href="/support">
          Contact the developer
        </Link>
      </section>
    </div>
  );
}

export default function HomePage() {
  return <HomeContent locale={DEFAULT_LOCALE} />;
}
