import type { Metadata } from "next";
import InstalledPage from "./InstalledPage";
import { lifecycleCopy } from "@/lib/lifecycle-copy";
import { getRequestLocale } from "@/lib/request-locale";
import "../globals.css";

export const metadata: Metadata = {
  title: "Installed",
  robots: { index: false, follow: false },
};

/** Fallback for an extension that opens /installed without naming itself. */
export default async function Installed({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const query = await searchParams;
  const locale = await getRequestLocale(query.lang);
  return <InstalledPage ext={null} copy={lifecycleCopy(locale)} locale={locale} />;
}
