import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BUNDLE_PLAN,
  EXTENSION_STATIC_SLUGS,
  getExtension,
  planForProduct,
} from "@/lib/extensions";
import { getCombosFor } from "@/lib/products";
import type { PremiumSlug } from "@/lib/products";
import { Rating } from "../ExtensionBadge";
import PricingPanel from "./PricingPanel";
import ScreenshotGallery from "./ScreenshotGallery";

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
  const packagePlans = premium
    ? [
        ...getCombosFor(ext.slug as PremiumSlug).map(planForProduct),
        BUNDLE_PLAN,
      ]
    : [];

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

      {premium && packagePlans.length ? (
        <PricingPanel
          extension={`${ext.slug}-packages`}
          plans={packagePlans}
          packagesOnly
        />
      ) : null}

      {premium ? (
        <div className="extension-payment-note">
          <span className="payment-shield" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 2.5 20 6v5.5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3.5Z" />
              <path d="m8.5 12 2.2 2.2 4.8-5" />
            </svg>
          </span>
          <p>
            Payments are securely processed by <strong>Creem</strong>, our
            Merchant of Record. Your license unlocks the extension or package
            you choose after payment. See our{" "}
            <Link href="/refund">Refund Policy</Link> and{" "}
            <Link href="/terms">Terms</Link>.
          </p>
        </div>
      ) : null}
    </div>
  );
}
