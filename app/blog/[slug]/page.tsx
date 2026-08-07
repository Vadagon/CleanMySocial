import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, PROMOS, getArticle } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";
import { PromoBox, PromoInline } from "../PromoBox";

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
  return { title: meta.title, description: meta.description };
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

  return (
    <article className="blog-article marketing-page">
      <header className="blog-article-head">
        <p className="blog-breadcrumb">
          <Link href="/blog">← All articles</Link>
        </p>
        <span className="eyebrow">{article.category}</span>
        <h1>{article.title}</h1>
        <p className="blog-meta">
          {new Date(article.date + "T00:00:00Z").toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
          })}
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
    </article>
  );
}
