import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EXTENSIONS, getExtension, localizeExtension } from "@/lib/extensions";
import { lifecycleCopy } from "@/lib/lifecycle-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { recommendationRotationKey, recommendationsFor } from "@/lib/upsell";
import UninstallSurvey from "../UninstallSurvey";
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
    title: ext ? `Help us improve ${ext.shortName}` : "Uninstall feedback",
    robots: { index: false, follow: false },
  };
}

export default async function UninstalledPage({
  params,
  searchParams,
}: {
  params: Promise<{ extension: string }>;
  searchParams: Promise<{ version?: string | string[]; lang?: string | string[] }>;
}) {
  const { extension } = await params;
  const query = await searchParams;
  const locale = await getRequestLocale(query.lang);
  const ext = getExtension(extension, locale);
  if (!ext) notFound();
  const rawVersion = Array.isArray(query.version) ? query.version[0] : query.version;
  const version = typeof rawVersion === "string" ? rawVersion.slice(0, 40) : "";
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
      version={version}
      copy={lifecycleCopy(locale)}
      recommendations={recommendations}
      locale={locale}
    />
  );
}
