import type { Metadata } from "next";
import { SITE } from "./site";

/**
 * One publisher identity for the whole site.
 *
 * The full node is emitted once, on the home page. Everywhere else references
 * it by @id — six separate copies of the same Person is what stops search
 * engines merging them into a single entity.
 */
export const DEVELOPER_ID = `${SITE.url}/#developer`;
export const DEVELOPER_REF = { "@type": "Person", "@id": DEVELOPER_ID } as const;

const DEFAULT_SOCIAL_IMAGE = "/screenshots/facebook-instagram-cleaner/screen1.webp";

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, SITE.url).toString();
}

export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_SOCIAL_IMAGE,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE.name,
      title,
      description,
      images: [{ url: absoluteUrl(image), alt: `${title} — ${SITE.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(image)],
    },
  };
}

export function articleMetadata({
  title,
  description,
  path,
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description: string;
  path: string;
  publishedTime: string;
  modifiedTime?: string;
}): Metadata {
  const base = pageMetadata({ title, description, path });
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime,
      modifiedTime: modifiedTime ?? publishedTime,
      authors: [SITE.legalName],
    },
  };
}

export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
