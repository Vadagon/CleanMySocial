import Link from "next/link";
import Image from "next/image";
import "../globals.css";
import "../seo-content.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  EXTENSION_STATIC_SLUGS,
  getExtension,
} from "@/lib/extensions";
import { UserCount } from "../ExtensionBadge";
import PricingPanel from "./PricingPanel";
import CrossPromo from "../CrossPromo";
import PaymentNotice from "../PaymentNotice";
import JsonLd from "../JsonLd";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { getPublicRelease } from "@/lib/releases";
import ExpandableDescription from "./ExpandableDescription";
import ProductDetails from "./ProductDetails";
import ProductScreenshot from "./ProductScreenshot";
import ProductInstallAction from "./ProductInstallAction";

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
  const release = getPublicRelease(ext.slug);
  const paidOffers = ext.plans.map((plan) => ({
    "@type": "Offer",
    name: plan.label,
    price: plan.price.replace(/[^0-9.]/g, ""),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: absoluteUrl(`/${ext.slug}`),
  }));
  const offers = [
    ...(ext.freePlan ? [{
      "@type": "Offer",
      name: `${ext.name} free plan`,
      description: ext.freePlan.allowance,
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: ext.storeUrl,
    }] : []),
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
    author: { "@type": "Person", "@id": `${SITE.url}/#developer`, name: SITE.legalName, url: SITE.url },
    softwareVersion: release?.version,
    dateModified: release?.updatedIso,
    offers,
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
          // NOTE: these questions are not rendered anywhere on the page — the
          // product-details block that showed them was removed. Google expects
          // FAQ markup to match visible content, so this is knowingly out of
          // step with that guidance. Kept deliberately; if the rich result is
          // ever flagged, render the Q&A again rather than editing this.
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
              <UserCount ext={ext} />
            </div>
          </div>

          <ExpandableDescription description={ext.description} />

          {premium ? (
            <ProductInstallAction extension={ext.slug} storeUrl={ext.storeUrl} />
          ) : null}

          {ext.screenshots?.[0] ? (
            <ProductScreenshot
              src={ext.screenshots[0].src}
              alt={ext.screenshots[0].alt}
            />
          ) : null}

          <div className="extension-meta">
            <a href={ext.storeUrl} target="_blank" rel="noreferrer">
              View on the Chrome Web Store →
            </a>
            <span aria-hidden="true">·</span>
            <Link href={`/privacy/${ext.slug}`}>Privacy policy</Link>
          </div>

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
              users={ext.users}
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
            <span className="badge">Unlimited</span>
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
              <strong>Need a cleanup tool too?</strong>
              <span>
                Every CleanMySocial extension is sold on its own — monthly, or
                lifetime for the price of two months.
              </span>
              <Link href="/pricing">See all tools and prices →</Link>
            </div>
          </aside>
        )}
      </div>

      <ProductDetails ext={ext} />

      <CrossPromo slug={ext.slug} />

      {premium ? (
        <PaymentNotice variant="banner" />
      ) : null}
    </div>
  );
}
