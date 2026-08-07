import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BUNDLE_PLAN,
  EXTENSION_STATIC_SLUGS,
  getExtension,
  groupOf,
} from "@/lib/extensions";
import { Rating } from "../ExtensionBadge";
import PricingPanel from "./PricingPanel";

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

  return (
    <div className="extension-page">
      <p className="extension-back">
        <Link href="/">← All extensions</Link>
      </p>

      <div className="extension-layout">
        <section className="extension-overview">
          <p className="extension-eyebrow">
            {premium ? "Included in CleanMySocial" : "Free CleanMySocial tool"}
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
            <section
              className="extension-shots"
              aria-label={`${ext.name} screenshots`}
            >
              {ext.screenshots.map((shot) => (
                <figure key={shot.src}>
                  <Image src={shot.src} alt={shot.alt} width={640} height={400} />
                  <figcaption className="sr-only">{shot.alt}</figcaption>
                </figure>
              ))}
            </section>
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
            aria-label="Purchase CleanMySocial"
          >
            <PricingPanel extension={groupOf(ext)} plans={ext.plans} detail />
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
              <strong>Want every cleanup tool?</strong>
              <span>
                One {BUNDLE_PLAN.price} lifetime license unlocks the other
                premium extensions.
              </span>
              <Link href="/pricing">See CleanMySocial pricing →</Link>
            </div>
          </aside>
        )}
      </div>

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
            Merchant of Record. One license unlocks every CleanMySocial
            extension after payment. See our{" "}
            <Link href="/refund">Refund Policy</Link> and{" "}
            <Link href="/terms">Terms</Link>.
          </p>
        </div>
      ) : null}
    </div>
  );
}
