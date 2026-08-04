import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EXTENSION_STATIC_SLUGS, getExtension, groupOf } from "@/lib/extensions";
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
      <p className="eyebrow">
        {ext.plans.length ? "Included with CleanMySocial" : "Free Chrome extension"}
      </p>
      <h1>{ext.name}</h1>
      <p className="muted" style={{ maxWidth: 640 }}>
        {ext.description}
      </p>

      {ext.plans.length ? (
        <>
          <p><strong>One purchase unlocks this extension and the other two premium CleanMySocial tools.</strong></p>
          <PricingPanel extension={groupOf(ext)} plans={ext.plans} />
        </>
      ) : (
        <p><strong>Free forever, with no quotas, checkout, subscription, or license key.</strong></p>
      )}

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
