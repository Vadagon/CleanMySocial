import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

// Load the actual TypeScript content modules once, then advance time in the same
// process. Reloading modules between dates would miss a frozen publication list.
const require = createRequire(import.meta.url);
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const localRequire = (name) => name.startsWith("@/")
    ? load(path.resolve(`${name.slice(2)}.ts`)) : require(name);
  new Function("require", "module", "exports", outputText)(localRequire, module, module.exports);
  return module.exports;
}

const previousNow = process.env.CONTENT_NOW;
try {
  process.env.CONTENT_NOW = "2026-09-09T23:59:59Z";
  const blog = load(path.resolve("lib/blog.ts"));
  const { SCHEDULED_ARTICLES } = load(path.resolve("lib/editorial-calendar.ts"));
  assert.equal(SCHEDULED_ARTICLES.length, 52);
  const pillars = blog.getPublishedArticles().filter((article) => article.pillar);
  assert.equal(pillars.length, 8);
  assert.equal(new Set([...pillars, ...SCHEDULED_ARTICLES].map((a) => a.primaryKeyword)).size, 60);
  assert.equal(new Set([...pillars, ...SCHEDULED_ARTICLES].map((a) => a.slug)).size, 60);
  for (let offset = -1; offset <= 26; offset++) {
    const now = new Date("2026-09-10T00:00:00Z");
    now.setUTCDate(now.getUTCDate() + offset);
    process.env.CONTENT_NOW = now.toISOString();
    const published = blog.getPublishedArticles();
    const expected = Math.max(0, Math.min(52, (offset + 1) * 2));
    assert.equal(SCHEDULED_ARTICLES.filter((a) => blog.getArticle(a.slug)).length, expected);
    for (const article of SCHEDULED_ARTICLES) {
      const loaded = blog.getArticle(article.slug);
      assert.equal(Boolean(loaded), article.date <= now.toISOString().slice(0, 10));
      if (!loaded) continue;
      assert.ok(loaded.body.length > 0);
      assert.ok(blog.getPillarArticle(article)?.pillar);
      assert.ok(loaded.body.includes(`](${article.productHref})`));
      for (const related of blog.getRelatedArticles(article)) {
        assert.ok(published.some((a) => a.slug === related.slug));
      }
    }
    for (const pillar of pillars) {
      const guides = blog.getArticlesForProduct(pillar.productHref.slice(1), 100);
      assert.ok(guides.some((a) => a.slug === pillar.slug));
      assert.ok(guides.every((a) => published.some((p) => p.slug === a.slug)));
    }
  }
  console.log("Content checks passed: 8 pillars, 52 supporting guides, 60 unique keywords, all UTC release dates, warm-server rollover, and published-only product/related links.");
} finally {
  if (previousNow === undefined) delete process.env.CONTENT_NOW;
  else process.env.CONTENT_NOW = previousNow;
}
