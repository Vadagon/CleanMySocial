import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, PROMOS, getArticle } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";
import { PromoBox, PromoInline } from "../PromoBox";
import JsonLd from "@/app/JsonLd";
import { articleMetadata, absoluteUrl } from "@/lib/seo";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = ARTICLES.find((a) => a.slug === slug);
  if (!meta) return {};
  return articleMetadata({
    title: meta.title,
    description: meta.description,
    path: `/blog/${meta.slug}`,
    publishedTime: meta.date,
    modifiedTime: meta.updated,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const promo = PROMOS[article.promo];
  // "[[PROMO]]" in the markdown marks where the inline ad goes mid-article.
  const segments = article.body.split("[[PROMO]]");
  const articleUrl = absoluteUrl(`/blog/${article.slug}`);

  return (
    <article className="blog-article marketing-page">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.description,
            datePublished: article.date,
            dateModified: article.updated ?? article.date,
            mainEntityOfPage: articleUrl,
            author: {
              "@type": "Person",
              name: SITE.legalName,
              url: SITE.url,
            },
            publisher: {
              "@type": "Person",
              name: SITE.legalName,
              url: SITE.url,
            },
            isPartOf: {
              "@type": "Blog",
              name: `${SITE.name} guides`,
              url: absoluteUrl("/blog"),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
              { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/blog") },
              { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
            ],
          },
        ]}
      />
      <header className="blog-article-head">
        <p className="blog-breadcrumb">
          <Link href="/blog">← All articles</Link>
        </p>
        <span className="eyebrow">{article.category}</span>
        <h1>{article.title}</h1>
        <p className="blog-meta">
          {article.updated ? "Last verified " : "Published "}
          {new Date((article.updated ?? article.date) + "T00:00:00Z").toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
          })}
          {" · Written and verified by "}{SITE.legalName}
        </p>
      </header>

      {segments.map((seg, i) => (
        <div key={i}>
          {i > 0 && <PromoInline promo={promo} />}
          <div
            className="blog-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(seg) }}
          />
        </div>
      ))}

      <PromoBox promo={promo} />

      <aside className="article-review-note" aria-label="Editorial information">
        <strong>How this guide is maintained</strong>
        <p>
          Instructions are checked against the current browser extensions and the
          platform flows available on the verification date. Facebook and Instagram
          can change their interfaces without notice.
        </p>
      </aside>

      <section className="related-guides" aria-labelledby="related-guides-title">
        <h2 id="related-guides-title">Related {article.category.toLowerCase()} guides</h2>
        <div className="related-guide-links">
          {ARTICLES.filter(
            (candidate) =>
              candidate.category === article.category && candidate.slug !== article.slug
          )
            .slice(0, 3)
            .map((candidate) => (
              <Link key={candidate.slug} href={`/blog/${candidate.slug}`}>
                {candidate.title}
                <span aria-hidden="true"> →</span>
              </Link>
            ))}
        </div>
      </section>
    </article>
  );
}
