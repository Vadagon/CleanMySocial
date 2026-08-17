import type { MetadataRoute } from "next";
import { EXTENSIONS } from "@/lib/extensions";
import { ARTICLES } from "@/lib/blog";
import { PACKAGES } from "@/lib/products";
import { PRIVACY } from "@/lib/privacy";
import { absoluteUrl } from "@/lib/seo";
import { GUIDE_TOPICS } from "@/lib/guides";
import { PUBLIC_RELEASES } from "@/lib/releases";

/**
 * Every `lastModified` here is derived from a date that describes real
 * content — a store release, an article revision, a policy revision.
 *
 * One hardcoded date across every URL is worse than no date at all: it claims
 * a change on every deploy, and a crawler that learns the claim is empty stops
 * weighting it. Where a page has no date of its own, it inherits the newest
 * date among the things it actually lists, so it moves when its content does.
 *
 * `EDITORIAL_UPDATED` is the one hand-maintained part. Bump an entry when you
 * genuinely rewrite that page, and leave it alone otherwise.
 */
const day = (value: string) => new Date(`${value}T00:00:00Z`);

const newest = (dates: string[]) => day(dates.slice().sort().at(-1) ?? "2026-01-01");

const releaseBySlug = new Map(PUBLIC_RELEASES.map((r) => [r.slug, r.updatedIso]));
const releaseDates = PUBLIC_RELEASES.map((r) => r.updatedIso);
const articleDates = ARTICLES.map((a) => a.updated ?? a.date);

/** Pages whose text changes only when someone edits it. ISO dates. */
const EDITORIAL_UPDATED: Record<string, string> = {
  "/pricing": "2026-08-13",
  "/support": "2026-08-12",
  "/privacy": "2026-08-04",
  "/terms": "2026-08-13",
  "/refund": "2026-08-12",
};

/** Privacy notices all carry the same reviewed date (see UPDATED in privacy.ts). */
const PRIVACY_UPDATED = "2026-08-04";

export default function sitemap(): MetadataRoute.Sitemap {
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

  const staticModified = (path: string) => {
    // The homepage lists every tool and links the guides, so it is as fresh as
    // the newest of either. The blog index and changelog follow their own feeds.
    if (path === "/") return newest([...releaseDates, ...articleDates]);
    if (path === "/blog") return newest(articleDates);
    if (path === "/changelog") return newest(releaseDates);
    return day(EDITORIAL_UPDATED[path] ?? "2026-08-12");
  };

  return [
    ...staticPages.map(([path, priority]) => ({
      url: absoluteUrl(path),
      lastModified: staticModified(path),
      priority,
    })),
    ...EXTENSIONS.map((extension) => ({
      url: absoluteUrl(`/${extension.slug}`),
      lastModified: day(releaseBySlug.get(extension.slug) ?? "2026-08-12"),
      priority: 0.9,
    })),
    ...PACKAGES.map((product) => ({
      url: absoluteUrl(`/packages/${product.slug}`),
      lastModified: newest(releaseDates),
      priority: 0.7,
    })),
    ...GUIDE_TOPICS.map((topic) => ({
      url: absoluteUrl(`/guides/${topic.slug}`),
      lastModified: newest(articleDates),
      priority: 0.8,
    })),
    ...ARTICLES.map((article) => ({
      url: absoluteUrl(`/blog/${article.slug}`),
      lastModified: day(article.updated ?? article.date),
      priority: 0.7,
    })),
    ...PRIVACY.map((policy) => ({
      url: absoluteUrl(`/privacy/${policy.slug}`),
      lastModified: day(PRIVACY_UPDATED),
      priority: 0.2,
    })),
    {
      url: absoluteUrl("/privacy/instagram-cleaner"),
      lastModified: day("2026-08-17"),
      priority: 0.2,
    },
  ];
}
