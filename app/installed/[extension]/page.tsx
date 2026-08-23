import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EXTENSIONS, getExtension } from "@/lib/extensions";
import InstalledPage from "../InstalledPage";
import { lifecycleCopy } from "@/lib/lifecycle-copy";
import { getRequestLocale } from "@/lib/request-locale";
import "../../globals.css";

export const revalidate = 86_400;

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

export default async function Installed({
  params,
  searchParams,
}: {
  params: Promise<{ extension: string }>;
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const { extension } = await params;
  const query = await searchParams;
  const locale = await getRequestLocale(query.lang);
  const ext = getExtension(extension, locale);
  if (!ext) notFound();
  return <InstalledPage ext={ext} copy={lifecycleCopy(locale)} locale={locale} />;
}
