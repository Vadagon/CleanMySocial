import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES, PROMOS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides for cleaning up your own Facebook and Messenger accounts.",
};

const CATEGORY_ORDER = [
  "Messenger",
  "Facebook friends",
];

export default function BlogIndexPage() {
  return (
    <div className="blog-index marketing-page">
      <section className="home-hero">
        <span className="eyebrow">Clean smarter</span>
        <h1>Blog</h1>
        <p>
          Practical guides for cleaning up your own Facebook and Messenger
          accounts.
        </p>
      </section>

      {CATEGORY_ORDER.map((cat) => {
        const items = ARTICLES.filter((a) => a.category === cat).sort((a, b) =>
          b.date.localeCompare(a.date)
        );
        return (
          <section key={cat} className="blog-section">
            <h2>{cat}</h2>
            <div className="blog-list">
              {items.map((a) => (
                <Link key={a.slug} href={`/blog/${a.slug}`} className="blog-card">
                  <span className="blog-card-emoji" aria-hidden="true">
                    {PROMOS[a.promo].emoji}
                  </span>
                  <span className="blog-card-title">{a.title}</span>
                  <span className="blog-card-desc">{a.description}</span>
                  <span className="blog-card-date">
                    {new Date(a.date + "T00:00:00Z").toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                  <span className="blog-card-more">Read guide <span aria-hidden="true">→</span></span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
