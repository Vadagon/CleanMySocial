import type { MetadataRoute } from "next";
import { EXTENSIONS } from "@/lib/extensions";
import { ARTICLES } from "@/lib/blog";
import { PACKAGES } from "@/lib/products";
import { PRIVACY } from "@/lib/privacy";
import { absoluteUrl } from "@/lib/seo";
import { GUIDE_TOPICS } from "@/lib/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const changed = new Date("2026-08-12T00:00:00Z");
  const staticPages = [
    ["/", 1],
    ["/pricing", 0.9],
    ["/blog", 0.8],
    ["/changelog", 0.6],
    ["/support", 0.5],
    ["/privacy", 0.3],
    ["/terms", 0.2],
    ["/refund", 0.2],
  ] as const;

  return [
    ...staticPages.map(([path, priority]) => ({
      url: absoluteUrl(path),
      lastModified: changed,
      priority,
    })),
    ...EXTENSIONS.map((extension) => ({
      url: absoluteUrl(`/${extension.slug}`),
      lastModified: changed,
      priority: 0.9,
    })),
    ...PACKAGES.map((product) => ({
      url: absoluteUrl(`/packages/${product.slug}`),
      lastModified: changed,
      priority: 0.7,
    })),
    ...GUIDE_TOPICS.map((topic) => ({
      url: absoluteUrl(`/guides/${topic.slug}`),
      lastModified: changed,
      priority: 0.8,
    })),
    ...ARTICLES.map((article) => ({
      url: absoluteUrl(`/blog/${article.slug}`),
      lastModified: new Date(`${article.updated ?? article.date}T00:00:00Z`),
      priority: 0.7,
    })),
    ...PRIVACY.map((policy) => ({
      url: absoluteUrl(`/privacy/${policy.slug}`),
      lastModified: changed,
      priority: 0.2,
    })),
  ];
}
