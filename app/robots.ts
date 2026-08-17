import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Crawlers that feed answer engines are named explicitly rather than left to
 * the wildcard. Some of them treat an unnamed agent conservatively, and an
 * explicit list is also a self-documenting record of who we intend to allow —
 * so removing one later is a deliberate edit rather than a silent side effect.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
];

/** The private record browser and its API. Both also carry a noindex
 *  X-Robots-Tag header, since robots.txt is a request, not a lock. */
const PRIVATE_PATHS = ["/vault", "/vault/", "/crash", "/crash/", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    host: SITE.url,
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
