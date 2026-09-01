import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EXTENSION_STATIC_SLUGS } from "@/lib/extensions";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, localeFromPathSegment } from "@/lib/locales";
import { ProductPageContent, productMetadata } from "../page";

export const dynamicParams = false;

export function generateStaticParams() {
  return SUPPORTED_LOCALES
    .filter((locale) => locale !== DEFAULT_LOCALE)
    .flatMap((extension) => EXTENSION_STATIC_SLUGS.map((localizedExtension) => ({ extension, localizedExtension })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ extension: string; localizedExtension: string }>;
}): Promise<Metadata> {
  const { extension, localizedExtension } = await params;
  const locale = localeFromPathSegment(extension);
  if (!locale || locale === DEFAULT_LOCALE) return { title: "Not found" };
  return productMetadata(localizedExtension, locale);
}

export default async function LocalizedExtensionPage({
  params,
}: {
  params: Promise<{ extension: string; localizedExtension: string }>;
}) {
  const { extension, localizedExtension } = await params;
  const locale = localeFromPathSegment(extension);
  if (!locale || locale === DEFAULT_LOCALE) notFound();
  return <ProductPageContent extension={localizedExtension} locale={locale} />;
}
