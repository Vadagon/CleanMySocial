import Link from "next/link";
import Image from "next/image";
import "../globals.css";
import "../seo-content.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  EXTENSION_STATIC_SLUGS,
  getExtension,
  planForProduct,
} from "@/lib/extensions";
import { getDiscountPassFor, type PremiumSlug } from "@/lib/products";
import { discountCopy } from "@/lib/discount-copy";
import { purchaseCopy } from "@/lib/purchase-copy";
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
import { DEFAULT_LOCALE, LOCALE_NAMES, SUPPORTED_LOCALES, localeFromPathSegment, type Locale } from "@/lib/locales";
import { localeAlternates, localePath } from "@/lib/locale-path";
import { HomeContent } from "../page";

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...EXTENSION_STATIC_SLUGS.map((slug) => ({ extension: slug })),
    ...SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({ extension: locale })),
  ];
}

export function productMetadata(extension: string, locale: Locale): Metadata {
  const ext = getExtension(extension, locale);
  if (!ext) return { title: "Not found" };
  return pageMetadata({
    title: locale === DEFAULT_LOCALE ? ext.name : `${ext.name} — ${LOCALE_NAMES[locale]}`,
    description: ext.tagline,
    path: localePath(locale, `/${ext.slug}`),
    image: ext.screenshots?.[0]?.src || ext.icon,
    languages: localeAlternates(`/${ext.slug}`),
  });
}

export async function generateMetadata({ params }: { params: Promise<{ extension: string }> }): Promise<Metadata> {
  const { extension } = await params;
  const locale = localeFromPathSegment(extension);
  if (locale && locale !== DEFAULT_LOCALE) {
    return pageMetadata({
      title: `Chrome extensions for cleaning Facebook and Instagram — ${LOCALE_NAMES[locale]}`,
      description: "Privacy-conscious Chrome extensions for cleaning and organizing your social accounts.",
      path: localePath(locale, "/"),
      languages: localeAlternates("/"),
    });
  }
  return productMetadata(extension, DEFAULT_LOCALE);
}

export function ProductPageContent({ extension, locale }: { extension: string; locale: Locale }) {
  const ext = getExtension(extension, locale);
  if (!ext) notFound();

  const premium = ext.plans.length > 0;
  const discountProduct = getDiscountPassFor(ext.slug as PremiumSlug);
  const offerCopy = discountCopy(locale);
  const pricingCopy = purchaseCopy(locale);
  const localizedPlans = ext.plans.map((plan) => {
    if (plan.access === "pass") return { ...plan, label: pricingCopy.pass, cadence: pricingCopy.oneTime };
    if (plan.access === "subscription") return { ...plan, label: pricingCopy.monthly, cadence: pricingCopy.cancelAnytime, badge: pricingCopy.recommended };
    return { ...plan, label: pricingCopy.lifetime, cadence: pricingCopy.forever };
  });
  const discountPlan = discountProduct
    ? {
        ...planForProduct(discountProduct),
        label: offerCopy.passLabel,
        cadence: offerCopy.passCadence,
        badge: offerCopy.badge,
        highlight: true,
      }
    : undefined;
  const discountPricingPlans = discountPlan
    ? localizedPlans.map((plan) => plan.access === "pass"
      ? discountPlan
      : { ...plan, badge: undefined, highlight: false })
    : undefined;
  const release = getPublicRelease(ext.slug);
  const paidOffers = localizedPlans.map((plan) => ({
    "@type": "Offer",
    name: plan.label,
    price: plan.price.replace(/[^0-9.]/g, ""),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: absoluteUrl(localePath(locale, `/${ext.slug}`)),
    // Without the billing duration a subscription reads as a one-off price.
    ...(plan.recurring
      ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: plan.price.replace(/[^0-9.]/g, ""),
            priceCurrency: "USD",
            billingDuration: 1,
            billingIncrement: 1,
            unitCode: "MON",
          },
        }
      : plan.access === "pass"
        ? {
            eligibleDuration: {
              "@type": "QuantitativeValue",
              value: 3,
              unitCode: "DAY",
            },
          }
        : {}),
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
    url: absoluteUrl(localePath(locale, `/${ext.slug}`)),
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
              { "@type": "ListItem", position: 2, name: ext.name, item: absoluteUrl(localePath(locale, `/${ext.slug}`)) },
            ],
          },
          ...(locale === "en" ? [{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: ext.faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }] : []),
        ]}
      />
      <p className="extension-back">
        <Link href={localePath(locale, "/")}>← {pricingCopy.allExtensions}</Link>
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
              <UserCount ext={ext} locale={locale} />
            </div>
          </div>

          <ExpandableDescription description={ext.description} locale={locale} />

          {premium ? (
            <ProductInstallAction extension={ext.slug} storeUrl={ext.storeUrl} locale={locale} />
          ) : null}

          {ext.screenshots?.[0] ? (
            <ProductScreenshot
              src={ext.screenshots[0].src}
              alt={ext.screenshots[0].alt}
            />
          ) : null}

          <div className="extension-meta">
            <a href={ext.storeUrl} target="_blank" rel="noreferrer">
              {pricingCopy.viewStore} →
            </a>
            <span aria-hidden="true">·</span>
            <Link href={`/privacy/${ext.slug}`}>{pricingCopy.privacyPolicy}</Link>
          </div>

        </section>

        {premium ? (
          <aside
            id="access-options"
            className="extension-purchase-card notranslate"
            translate="no"
            aria-label={`Free and paid access options for ${ext.name}`}
          >
            <PricingPanel
              key={`${ext.slug}:${locale}`}
              extension={ext.slug}
              plans={localizedPlans}
              discountPlans={discountPricingPlans}
              users={ext.users}
              freePlan={ext.freePlan}
              storeUrl={ext.storeUrl}
              locale={locale}
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

      {/* The long SEO accordion is authored and reviewed in English. Never mix
          it into a localized purchase page; localized visitors already have
          the translated product summary, screenshot, plans and checkout. */}
      {locale === "en" ? <ProductDetails ext={ext} /> : null}

      <CrossPromo slug={ext.slug} locale={locale} />

      {premium && locale === "en" ? (
        <PaymentNotice variant="banner" />
      ) : null}
    </div>
  );
}

export default async function ExtensionPage({ params }: { params: Promise<{ extension: string }> }) {
  const { extension } = await params;
  const locale = localeFromPathSegment(extension);
  if (locale && locale !== DEFAULT_LOCALE) return <HomeContent locale={locale} />;
  return <ProductPageContent extension={extension} locale={DEFAULT_LOCALE} />;
}
