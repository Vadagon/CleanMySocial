import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EXTENSIONS, getExtension, localizeExtension } from "@/lib/extensions";
import { lifecycleCopy } from "@/lib/lifecycle-copy";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";
import { recommendationRotationKey, recommendationsFor } from "@/lib/upsell";
import UninstallSurvey from "../UninstallSurvey";
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
    title: ext ? `Help us improve ${ext.shortName}` : "Uninstall feedback",
    robots: { index: false, follow: false },
  };
}

export function UninstalledContent({ extension, locale }: { extension: string; locale: Locale }) {
  const ext = getExtension(extension, locale);
  if (!ext) notFound();
  const recommendations = recommendationsFor(ext.slug, {
    limit: 3,
    rotationKey: recommendationRotationKey("uninstalled"),
  }).map(({ extension: item }) => {
    const localized = localizeExtension(item, locale);
    return {
      slug: localized.slug,
      shortName: localized.shortName,
      icon: localized.icon,
      highlight: locale === "en" ? localized.installedHighlights[0] : localized.tagline,
    };
  });

  return (
    <UninstallSurvey
      extension={{
        slug: ext.slug,
        name: ext.shortName,
        icon: ext.icon,
        storeUrl: ext.storeUrl,
      }}
      version=""
      copy={lifecycleCopy(locale)}
      recommendations={recommendations}
      locale={locale}
    />
  );
}

export default async function UninstalledPage({ params }: { params: Promise<{ extension: string }> }) {
  const { extension } = await params;
  return <UninstalledContent extension={extension} locale={DEFAULT_LOCALE} />;
}
