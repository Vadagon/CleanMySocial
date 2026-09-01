import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EXTENSIONS, getExtension } from "@/lib/extensions";
import InstalledPage from "../InstalledPage";
import { lifecycleCopy } from "@/lib/lifecycle-copy";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";
import "../../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return EXTENSIONS.map((extension) => ({ extension: extension.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ extension: string }>;
}): Promise<Metadata> {
  const { extension } = await params;
  const ext = getExtension(extension);
  return {
    title: ext ? `${ext.shortName} is installed` : "Installed",
    // A thank-you page has nothing to offer search, and nine near-identical
    // ones have less than nothing.
    robots: { index: false, follow: false },
  };
}

export function InstalledContent({ extension, locale }: { extension: string; locale: Locale }) {
  const ext = getExtension(extension, locale);
  if (!ext) notFound();
  return <InstalledPage ext={ext} copy={lifecycleCopy(locale)} locale={locale} />;
}

export default async function Installed({ params }: { params: Promise<{ extension: string }> }) {
  const { extension } = await params;
  return <InstalledContent extension={extension} locale={DEFAULT_LOCALE} />;
}
