import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BUNDLE_PLAN,
  EXTENSION_STATIC_SLUGS,
  getExtension,
} from "@/lib/extensions";
import { getCombosFor } from "@/lib/products";
import type { PremiumSlug } from "@/lib/products";
import { Rating } from "../ExtensionBadge";
import PricingPanel from "./PricingPanel";
import ScreenshotGallery from "./ScreenshotGallery";
import PackageDealCard from "../PackageDealCard";
import AllToolsDealCard from "../AllToolsDealCard";
import PaymentNotice from "../PaymentNotice";

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
  return { title: ext.name, description: ext.tagline };
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

  return (
    <div className="extension-page">
      <p className="extension-back">
        <Link href="/">← All extensions</Link>
      </p>

      <div className="extension-layout">
        <section className="extension-overview">
          <p className="extension-eyebrow">
            {premium ? "Premium Chrome extension" : "Free Chrome extension"}
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

          <p className="extension-description">{ext.description}</p>

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
        </section>

        {premium ? (
          <aside
            className="extension-purchase-card"
            aria-label={`Purchase ${ext.name}`}
          >
            <PricingPanel
              extension={ext.slug}
              plans={ext.plans}
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
        <>
          {comboDeals.length ? (
            <section className="extension-deals" aria-labelledby="extension-deals-title">
              <span className="pricing-section-kicker">Discounted packages</span>
              <h2 id="extension-deals-title">Save with a focused package</h2>
              <p className="muted">
                Compare the included tools before you buy. One license key
                unlocks both extensions in the package.
              </p>
              <div className="alacarte-grid combo-grid">
                {comboDeals.map((product) => (
                  <PackageDealCard product={product} key={product.id} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="bundle-pricing-section extension-all-tools" aria-labelledby="extension-all-tools-title">
            <div className="bundle-section-heading">
              <span className="pricing-section-kicker">Want everything?</span>
              <h2 id="extension-all-tools-title">Get every CleanMySocial tool</h2>
              <p className="muted">The complete set remains the best overall value.</p>
            </div>
            <AllToolsDealCard />
          </section>
        </>
      ) : null}

      {premium ? (
        <PaymentNotice variant="banner" />
      ) : null}
    </div>
  );
}
