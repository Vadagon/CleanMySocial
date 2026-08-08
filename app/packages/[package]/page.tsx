import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PricingPanel from "@/app/[extension]/PricingPanel";
import { Rating } from "@/app/ExtensionBadge";
import { EXTENSIONS, getExtension, planForProduct } from "@/lib/extensions";
import { getPackageBySlug, PACKAGES } from "@/lib/products";

export function generateStaticParams() {
  return PACKAGES.map((product) => ({ package: product.slug! }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ package: string }>;
}): Promise<Metadata> {
  const { package: packageSlug } = await params;
  const product = getPackageBySlug(packageSlug);
  if (!product) return { title: "Package not found" };

  return {
    title: product.name,
    description: product.blurb,
  };
}

export default async function PackagePage({
  params,
}: {
  params: Promise<{ package: string }>;
}) {
  const { package: packageSlug } = await params;
  const product = getPackageBySlug(packageSlug);
  if (!product) notFound();

  const includedExtensions =
    product.kind === "bundle"
      ? EXTENSIONS
      : product.entitlements
          .map((slug) => getExtension(slug))
          .filter((extension): extension is NonNullable<typeof extension> => Boolean(extension));

  return (
    <div className="page package-page marketing-page">
      <p className="package-back">
        <Link href="/pricing">← All pricing options</Link>
      </p>

      <header className="package-hero">
        <div>
          <span className="eyebrow">
            {product.kind === "bundle" ? "Best overall value" : "Two-tool discount"}
          </span>
          <h1>{product.name}</h1>
          <p>{product.blurb}</p>
        </div>
        <div className="package-hero-price" aria-label={`${product.price}, one-time payment`}>
          <span>{product.price}</span>
          {product.compareAt ? <s>{product.compareAt}</s> : null}
          <small>one-time payment · lifetime access</small>
        </div>
      </header>

      <section className="package-includes" aria-labelledby="package-includes-title">
        <span className="pricing-section-kicker">What’s included</span>
        <h2 id="package-includes-title">
          {includedExtensions.length} focused extensions, one license key
        </h2>
        <p className="muted">
          Review each tool before you decide. Follow any link for screenshots,
          ratings, and the complete product description.
        </p>

        <div className="package-product-grid">
          {includedExtensions.map((extension) => (
            <article className="package-product-card" key={extension.slug}>
              <div className="package-product-heading">
                <Image src={extension.icon} alt="" width={64} height={64} />
                <div>
                  <h3>{extension.name}</h3>
                  <Rating ext={extension} linked={false} />
                </div>
              </div>
              <p>{extension.tagline}</p>
              <Link href={`/${extension.slug}`}>
                View extension details →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="package-purchase" aria-labelledby="package-purchase-title">
        <div className="package-purchase-copy">
          <span className="pricing-section-kicker">Ready when you are</span>
          <h2 id="package-purchase-title">Unlock the complete package</h2>
          <p className="muted">
            One payment unlocks every extension listed above. We’ll email one
            license key that works across the package.
          </p>
        </div>
        <div className="package-purchase-card">
          <PricingPanel
            extension={`package-${product.slug}`}
            plans={[planForProduct(product)]}
          />
        </div>
      </section>
    </div>
  );
}
