const baseUrl = (process.env.SEO_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const productionOrigin = "https://www.cleanmysocial.com";

function fail(message) {
  throw new Error(message);
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function match(html, pattern) {
  return decodeHtml(html.match(pattern)?.[1]?.trim() || "");
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) fail(`${response.status} ${url}`);
  return { response, text: await response.text() };
}

const sitemap = await fetchText(`${baseUrl}/sitemap.xml`);
const productionUrls = [...sitemap.text.matchAll(/<loc>(.*?)<\/loc>/g)].map((item) =>
  decodeHtml(item[1])
);

if (productionUrls.length < 30) fail(`Sitemap is unexpectedly small: ${productionUrls.length} URLs`);
if (new Set(productionUrls).size !== productionUrls.length) fail("Sitemap contains duplicate URLs");

const pages = await Promise.all(
  productionUrls.map(async (productionUrl) => {
    const path = new URL(productionUrl).pathname;
    const localUrl = `${baseUrl}${path}`;
    const { text: html } = await fetchText(localUrl);
    const title = match(html, /<title>(.*?)<\/title>/is);
    const description = match(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/is
    );
    const canonical = match(
      html,
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/is
    );
    const h1Count = (html.match(/<h1(?:\s|>)/gi) || []).length;
    const mainCount = (html.match(/<main(?:\s|>)/gi) || []).length;

    if (!title) fail(`Missing title: ${path}`);
    if (!description) fail(`Missing description: ${path}`);
    if (h1Count !== 1) fail(`Expected one h1, found ${h1Count}: ${path}`);
    if (mainCount !== 1) fail(`Expected one main landmark, found ${mainCount}: ${path}`);
    if (!canonical) fail(`Missing canonical: ${path}`);
    if (new URL(canonical).pathname !== path) {
      fail(`Canonical path mismatch: ${path} -> ${canonical}`);
    }

    for (const script of html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis
    )) {
      try {
        JSON.parse(script[1]);
      } catch {
        fail(`Invalid JSON-LD: ${path}`);
      }
    }

    for (const imageTag of html.matchAll(/<img\b[^>]*>/gis)) {
      if (!/\balt=["'][^"']*["']/i.test(imageTag[0])) fail(`Image missing alt attribute: ${path}`);
    }

    const internalPaths = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gis)]
      .map((link) => link[1])
      .filter((href) => href.startsWith("/") && !href.startsWith("//"))
      .map((href) => new URL(href, productionOrigin).pathname);

    return { path, title, canonical, internalPaths };
  })
);

for (const field of ["title", "canonical"]) {
  const values = pages.map((page) => page[field]);
  if (new Set(values).size !== values.length) fail(`Duplicate ${field} values found`);
}

const linkedPaths = [...new Set(pages.flatMap((page) => page.internalPaths))];
await Promise.all(
  linkedPaths.map(async (path) => {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    if (response.status >= 400) fail(`Broken internal link: ${path} (${response.status})`);
  })
);

const robots = await fetchText(`${baseUrl}/robots.txt`);
if (!robots.text.includes(`${productionOrigin}/sitemap.xml`)) fail("robots.txt does not name the sitemap");

const llms = await fetchText(`${baseUrl}/llms.txt`);
if (!llms.text.includes("Vladyslav Verbytskyi")) fail("llms.txt is missing the authoritative developer identity");

const success = await fetchText(`${baseUrl}/success`);
if (!/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/is.test(success.text)) {
  fail("Private success route must be noindex");
}

console.log(
  `SEO check passed: ${pages.length} sitemap pages, ${linkedPaths.length} internal paths, robots.txt, llms.txt, and noindex routes.`
);
