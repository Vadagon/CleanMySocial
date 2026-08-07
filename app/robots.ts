import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The private record browser and its API. Also carries a noindex
        // X-Robots-Tag header, since robots.txt is a request, not a lock.
        disallow: ["/vault", "/vault/", "/api/"],
      },
    ],
    host: SITE.url,
  };
}
