import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InstalledPage from "@/app/installed/InstalledPage";
import { lifecycleCopy } from "@/lib/lifecycle-copy";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, localeFromPathSegment } from "@/lib/locales";

export const dynamicParams = false;

export const metadata: Metadata = {
  title: "Installed",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((extension) => ({ extension }));
}

export default async function LocalizedInstalledFallback({ params }: { params: Promise<{ extension: string }> }) {
  const { extension } = await params;
  const locale = localeFromPathSegment(extension);
  if (!locale || locale === DEFAULT_LOCALE) notFound();
  return <InstalledPage ext={null} copy={lifecycleCopy(locale)} locale={locale} />;
}
