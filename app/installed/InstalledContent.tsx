import { notFound } from "next/navigation";
import { getExtension } from "@/lib/extensions";
import { lifecycleCopy } from "@/lib/lifecycle-copy";
import type { Locale } from "@/lib/locales";
import InstalledPage from "./InstalledPage";

export default function InstalledContent({ extension, locale }: { extension: string; locale: Locale }) {
  const ext = getExtension(extension, locale);
  if (!ext) notFound();
  return <InstalledPage ext={ext} copy={lifecycleCopy(locale)} locale={locale} />;
}
