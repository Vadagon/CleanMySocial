import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/app/JsonLd";
import { ARTICLES } from "@/lib/blog";
import { GUIDE_TOPICS, getGuideTopic } from "@/lib/guides";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return GUIDE_TOPICS.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const topic = getGuideTopic((await params).topic);
  if (!topic) return {};
  return pageMetadata({
    title: topic.title,
    description: topic.description,
    path: `/guides/${topic.slug}`,
  });
}

export default async function GuideTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const topic = getGuideTopic((await params).topic);
  if (!topic) notFound();

  const articles = ARTICLES.filter((article) => article.category === topic.category).sort(
    (a, b) => (b.updated ?? b.date).localeCompare(a.updated ?? a.date)
  );
  const topicUrl = absoluteUrl(`/guides/${topic.slug}`);

  return (
    <div className="guide-topic marketing-page">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: topic.title,
            description: topic.description,
            url: topicUrl,
            dateModified: "2026-08-12",
            author: { "@type": "Person", name: SITE.legalName, url: absoluteUrl("/about") },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: articles.length,
              itemListElement: articles.map((article, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: article.title,
                url: absoluteUrl(`/blog/${article.slug}`),
              })),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
              { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/blog") },
              { "@type": "ListItem", position: 3, name: topic.title, item: topicUrl },
            ],
          },
        ]}
      />

      <header className="guide-topic-hero">
        <p className="blog-breadcrumb"><Link href="/blog">← All guide topics</Link></p>
        <span className="eyebrow">{topic.emoji} Topic guide</span>
        <h1>{topic.title}</h1>
        <p>{topic.description}</p>
      </header>

      <section className="guide-direct-answer" aria-labelledby="direct-answer-title">
        <span className="eyebrow">Short answer</span>
        <h2 id="direct-answer-title">What should you use?</h2>
        <p>{topic.answer}</p>
      </section>

      <section className="guide-article-section" aria-labelledby="topic-articles-title">
        <h2 id="topic-articles-title">Step-by-step guides</h2>
        <div className="guide-article-list">
          {articles.map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`}>
              <span>
                <strong>{article.title}</strong>
                <small>{article.description}</small>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <aside className="guide-product-fit">
        <span className="eyebrow">Recommended tool for this job</span>
        <h2>{topic.productName}</h2>
        <p>{topic.productFit}</p>
        <Link className="btn primary" href={topic.productHref}>See features, pricing, and privacy details</Link>
      </aside>
    </div>
  );
}
