import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BUNDLE_PLAN,
  EXTENSION_STATIC_SLUGS,
  EXTENSIONS,
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

  return (
    <div className="page">
      <p className="small">
        <Link href="/">← All extensions</Link>
      </p>
      <Image className="detail-icon" src={ext.icon} alt="" width={88} height={88} />
      <p className="eyebrow">Included in CleanMySocial</p>
      <h1>{ext.name}</h1>
      <Rating ext={ext} />
      <p className="muted" style={{ maxWidth: 640 }}>
        {ext.description}
      </p>

      {ext.plans.length ? (
        <>
          <p>
            <strong>
              One purchase unlocks this extension and every other CleanMySocial
              tool — {EXTENSIONS.length} in total.
            </strong>
          </p>
          <PricingPanel extension={groupOf(ext)} plans={ext.plans} />
        </>
      ) : (
        <>
          <p>
            <strong>
              This one needs no license key — install it and it works, with no
              quotas, checkout, or subscription.
            </strong>
          </p>
          <p className="muted">
            It is part of the CleanMySocial set of {EXTENSIONS.length} tools.
            One {BUNDLE_PLAN.price} lifetime license unlocks the rest.
          </p>
          <p>
            <Link className="btn" href="/pricing">
              See all {EXTENSIONS.length} tools
            </Link>
          </p>
        </>
      )}

      {ext.screenshots?.length ? (
        <section className="shots" aria-label={`${ext.name} screenshots`}>
          {ext.screenshots.map((shot) => (
            <figure key={shot.src}>
              <Image src={shot.src} alt={shot.alt} width={640} height={400} />
              <figcaption>{shot.alt}</figcaption>
            </figure>
          ))}
        </section>
      ) : null}

      <p className="small muted">
        <a href={ext.storeUrl} target="_blank" rel="noreferrer">
          View {ext.name} on the Chrome Web Store →
        </a>
      </p>
      <p className="small muted">
        Chrome Web Store ID: <code>{ext.storeId}</code> ·{" "}
        <Link href={`/privacy/${ext.slug}`}>Privacy policy</Link>
      </p>
    </div>
  );
}
