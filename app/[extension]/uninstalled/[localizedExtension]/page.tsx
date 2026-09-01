import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EXTENSIONS } from "@/lib/extensions";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, localeFromPathSegment } from "@/lib/locales";
import { UninstalledContent } from "@/app/uninstalled/[extension]/page";

export const dynamicParams = false;

export const metadata: Metadata = {
  title: "Uninstall feedback",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES
    .filter((locale) => locale !== DEFAULT_LOCALE)
    .flatMap((extension) => EXTENSIONS.map((item) => ({ extension, localizedExtension: item.slug })));
}

export default async function LocalizedUninstalled({
  params,
}: {
  params: Promise<{ extension: string; localizedExtension: string }>;
}) {
  const { extension, localizedExtension } = await params;
  const locale = localeFromPathSegment(extension);
  if (!locale || locale === DEFAULT_LOCALE) notFound();
  return <UninstalledContent extension={localizedExtension} locale={locale} />;
}
