import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";
import "../seo-content.css";
import { getExtension } from "@/lib/extensions";
import { PUBLIC_RELEASES } from "@/lib/releases";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "CleanMySocial changelog",
  description:
    "Public Chrome Web Store versions, update dates, and release highlights for every CleanMySocial extension.",
  path: "/changelog",
});

export default function ChangelogPage() {
  return (
    <div className="page changelog-page marketing-page">
      <header className="content-hero trust-hero">
        <span className="eyebrow">Product maintenance</span>
        <h1>CleanMySocial changelog</h1>
        <p>
          Public Chrome Web Store versions and practical release highlights for
          the four extensions. Listing data was checked on August 12, 2026.
        </p>
      </header>

      <div className="release-list">
        {PUBLIC_RELEASES.map((release) => {
          const extension = getExtension(release.slug);
          if (!extension) return null;
          return (
            <article className="release-card" key={release.slug}>
              <header>
                <div>
                  <span className="release-date">{release.updated}</span>
                  <h2>{extension.name}</h2>
                </div>
                <span className="release-version">Version {release.version}</span>
              </header>
              <ul>
                {release.changes.map((change) => <li key={change}>{change}</li>)}
              </ul>
              <div className="release-links">
                <Link href={`/${extension.slug}`}>Product details →</Link>
                <a href={extension.storeUrl} target="_blank" rel="noreferrer">Chrome Web Store →</a>
              </div>
            </article>
          );
        })}
      </div>

      <section className="release-method">
        <h2>How to read this page</h2>
        <p>
          Version numbers and update dates refer to the public Chrome Web Store
          listings, not unpublished source work. Feature descriptions summarize
          the behavior of the corresponding public product without promising a
          particular future update schedule.
        </p>
      </section>
    </div>
  );
}
