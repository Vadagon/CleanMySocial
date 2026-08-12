import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BUNDLE_PLAN,
  EXTENSION_STATIC_SLUGS,
  getExtension,
  hasUsableRating,
} from "@/lib/extensions";
import { getCombosFor } from "@/lib/products";
import type { PremiumSlug } from "@/lib/products";
import { Rating } from "../ExtensionBadge";
import PricingPanel from "./PricingPanel";
import ScreenshotGallery from "./ScreenshotGallery";
import PackageDealCard from "../PackageDealCard";
import AllToolsDealCard from "../AllToolsDealCard";
import PaymentNotice from "../PaymentNotice";
import JsonLd from "../JsonLd";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { getPublicRelease } from "@/lib/releases";
import ExpandableDescription from "./ExpandableDescription";
import ExpandableProductDetails from "./ExpandableProductDetails";

export function generateStaticParams() {
  return EXTENSION_STATIC_SLUGS.map((slug) => ({
    extension: slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ extension: string }>;
}): Promise<Metadata> {
  const { extension } = await params;
  const ext = getExtension(extension);
  if (!ext) return { title: "Not found" };
  return pageMetadata({
    title: ext.name,
    description: ext.tagline,
    path: `/${ext.slug}`,
    image: ext.screenshots?.[0]?.src || ext.icon,
  });
}

export default async function ExtensionPage({
  params,
}: {
  params: Promise<{ extension: string }>;
}) {
  const { extension } = await params;
  const ext = getExtension(extension);
  if (!ext) notFound();

  const premium = ext.plans.length > 0;
  const comboDeals = premium ? getCombosFor(ext.slug as PremiumSlug) : [];
  const release = getPublicRelease(ext.slug);
  const paidAccessLabel = ext.slug === "instagram-followers-tracker" ? "Pro" : "Unlimited";
  const paidPrice = ext.plans
    .map((plan) => `${plan.price}${plan.recurring ? "/month" : " lifetime"}`)
    .join(" or ");
  const paidOffers = ext.plans.map((plan) => ({
    "@type": "Offer",
    name: plan.label,
    price: plan.price.replace(/[^0-9.]/g, ""),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: absoluteUrl(`/${ext.slug}`),
  }));
  const offers = [
    {
      "@type": "Offer",
      name: `${ext.name} free plan`,
      description: ext.freePlan.allowance,
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: ext.storeUrl,
    },
    ...paidOffers,
  ];
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: ext.name,
    description: ext.description,
    url: absoluteUrl(`/${ext.slug}`),
    installUrl: ext.storeUrl,
    image: absoluteUrl(ext.icon),
    screenshot: ext.screenshots?.map((item) => absoluteUrl(item.src)),
    applicationCategory: "BrowserApplication",
    operatingSystem: "Google Chrome",
    author: { "@type": "Person", "@id": `${SITE.url}/#developer`, name: SITE.legalName, url: absoluteUrl("/about") },
    softwareVersion: release?.version,
    dateModified: release?.updatedIso,
    offers,
    ...(hasUsableRating(ext)
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ext.rating,
            ratingCount: ext.reviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <div className="extension-page">
      <JsonLd
        data={[
          softwareSchema,
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
              { "@type": "ListItem", position: 2, name: ext.name, item: absoluteUrl(`/${ext.slug}`) },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: ext.faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          },
        ]}
      />
      <p className="extension-back">
        <Link href="/">← All extensions</Link>
      </p>

      <div className="extension-layout">
        <section className="extension-overview">
          <p className="extension-eyebrow">
            {premium ? `Try free · Upgrade to ${paidAccessLabel}` : "Free Chrome extension"}
          </p>

          <div className="extension-heading">
            <Image
              className="extension-icon"
              src={ext.icon}
              alt=""
              width={112}
              height={112}
              priority
            />
            <div>
              <h1>{ext.name}</h1>
              <Rating ext={ext} />
            </div>
          </div>

          <ExpandableDescription description={ext.description} />

          {ext.screenshots?.length ? (
            <ScreenshotGallery name={ext.name} screenshots={ext.screenshots} />
          ) : null}

          <div className="extension-meta">
            <a href={ext.storeUrl} target="_blank" rel="noreferrer">
              View on the Chrome Web Store →
            </a>
            <span aria-hidden="true">·</span>
            <Link href={`/privacy/${ext.slug}`}>Privacy policy</Link>
          </div>

          {release ? (
            <dl className="product-maintenance" aria-label="Product maintenance information">
              <div>
                <dt>Public version</dt>
                <dd>{release.version}</dd>
              </div>
              <div>
                <dt>Store updated</dt>
                <dd><time dateTime={release.updatedIso}>{release.updated}</time></dd>
              </div>
              {release.minimumChrome ? (
                <div>
                  <dt>Requires</dt>
                  <dd>Chrome {release.minimumChrome}+</dd>
                </div>
              ) : null}
              <div>
                <dt>Developer</dt>
                <dd><Link href="/about">{SITE.legalName}</Link></dd>
              </div>
            </dl>
          ) : null}
        </section>

        {premium ? (
          <aside
            id="access-options"
            className="extension-purchase-card"
            aria-label={`Free and paid access options for ${ext.name}`}
          >
            <PricingPanel
              extension={ext.slug}
              plans={ext.plans}
              freePlan={ext.freePlan}
              storeUrl={ext.storeUrl}
              detail
            />
          </aside>
        ) : (
          <aside
            className="extension-purchase-card extension-free-card"
            aria-label={`Install ${ext.name}`}
          >
            <span className="badge">Free forever</span>
            <h2>No license key needed</h2>
            <div className="free-price">$0</div>
            <p>
              Install it from the Chrome Web Store and start using it right
              away. No account, quota, or subscription.
            </p>
            <a
              className="btn"
              href={ext.storeUrl}
              target="_blank"
              rel="noreferrer"
            >
              Add to Chrome
            </a>
            <div className="free-bundle-note">
              <strong>Need a premium cleanup tool too?</strong>
              <span>
                Buy premium extensions separately, choose a discounted pair,
                or get every premium tool for {BUNDLE_PLAN.price}.
              </span>
              <Link href="/pricing">Compare products and packages →</Link>
            </div>
          </aside>
        )}
      </div>

      {premium ? (
        <section className="extension-plan-compare" aria-labelledby="plan-compare-title">
          <header>
            <span id="plan-compare-title">Free vs {paidAccessLabel}</span>
            <a href="#access-options">Compare free and paid access ↓</a>
          </header>
          <div className="extension-plan-compare-grid">
            <div>
              <span>Free</span>
              <strong>$0</strong>
              <small>{ext.freePlan.headline}</small>
            </div>
            <div>
              <span>{paidAccessLabel}</span>
              <strong>{paidPrice}</strong>
              <small>{ext.freePlan.upgradeMessage}</small>
            </div>
          </div>
        </section>
      ) : null}

      <ExpandableProductDetails
        name={ext.name}
        slug={ext.slug}
        features={ext.features}
        steps={ext.steps}
        limitations={ext.limitations}
        faq={ext.faq}
      />

      {premium ? (
        <section
          className="extension-package-options"
          aria-labelledby="extension-package-options-title"
        >
          <span className="pricing-section-kicker">Package savings</span>
          <h2 id="extension-package-options-title">Save when you want more tools</h2>
          <div className="extension-package-options-grid">
            {comboDeals.map((product) => (
              <PackageDealCard product={product} compact key={product.id} />
            ))}
            <AllToolsDealCard compact />
          </div>
        </section>
      ) : null}

      {premium ? (
        <PaymentNotice variant="banner" />
      ) : null}
    </div>
  );
}
