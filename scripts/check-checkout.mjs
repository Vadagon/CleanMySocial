#!/usr/bin/env node

/**
 * Production checkout smoke test.
 *
 * This deliberately stops before creating a checkout session: it verifies the
 * complete public catalogue and the server preflight without writing pending
 * orders, sending email addresses, or triggering abandoned-cart reminders.
 * When CREEM_API_KEY is available it also compares every sellable product with
 * Creem's read-only product catalogue.
 */

import {
  ALL_PREMIUM_SLUGS,
  PROMOTIONAL,
  SELLABLE,
} from "../lib/products.ts";

const BASE_URL = (process.env.CHECKOUT_BASE_URL || "https://cleanmysocial.com").replace(/\/$/, "");
const CREEM_API_URL = (process.env.CREEM_API_URL || "https://api.creem.io/v1").replace(/\/$/, "");
const CREEM_API_KEY = process.env.CREEM_API_KEY || "";
const CONCURRENCY = 12;

const failures = [];

function fail(scope, message) {
  failures.push(`${scope}: ${message}`);
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "CleanMySocial checkout smoke test",
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function inBatches(items, worker) {
  for (let offset = 0; offset < items.length; offset += CONCURRENCY) {
    await Promise.all(items.slice(offset, offset + CONCURRENCY).map(worker));
  }
}

function productRoutesFromSitemap(xml) {
  const slugs = new Set(ALL_PREMIUM_SLUGS);
  const nonLocalePrefixes = new Set(["blog", "guides", "installed", "privacy", "uninstalled"]);
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1].replaceAll("&amp;", "&"))
    .filter((value) => {
      try {
        const url = new URL(value);
        const parts = url.pathname.split("/").filter(Boolean);
        return (
          (parts.length === 1 || (parts.length === 2 && !nonLocalePrefixes.has(parts[0]))) &&
          slugs.has(parts.at(-1))
        );
      } catch {
        return false;
      }
    });
}

async function checkProductPages() {
  const sitemapResponse = await fetchWithTimeout(`${BASE_URL}/sitemap.xml`);
  if (!sitemapResponse.ok) {
    fail("sitemap", `HTTP ${sitemapResponse.status}`);
    return 0;
  }

  const routes = productRoutesFromSitemap(await sitemapResponse.text());
  const expectedBySlug = new Map(
    ALL_PREMIUM_SLUGS.map((slug) => [
      slug,
      SELLABLE.filter((product) => product.entitlements.includes(slug)),
    ]),
  );

  for (const slug of ALL_PREMIUM_SLUGS) {
    if (!routes.some((route) => new URL(route).pathname.endsWith(`/${slug}`))) {
      fail(slug, "missing from sitemap");
    }
  }

  await inBatches(routes, async (route) => {
    const url = new URL(route);
    const slug = url.pathname.split("/").filter(Boolean).at(-1);
    const scope = url.pathname;
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        fail(scope, `HTTP ${response.status}`);
        return;
      }
      const html = await response.text();
      if (!html.includes('id="access-options"')) fail(scope, "purchase card is missing");
      if (!html.includes("extension-purchase-card notranslate")) fail(scope, "translation guard class is missing");
      if (!html.includes('translate="no"')) fail(scope, "translation guard attribute is missing");

      const radioCount = (html.match(/role="radio"/g) || []).length;
      if (radioCount !== 3) fail(scope, `expected 3 plans, found ${radioCount}`);

      for (const product of expectedBySlug.get(slug) || []) {
        if (!html.includes(product.id)) fail(scope, `missing product ${product.id}`);
        if (!html.includes(product.price)) fail(scope, `missing price ${product.price}`);
      }
    } catch (error) {
      fail(scope, error instanceof Error ? error.message : "request failed");
    }
  });

  return routes.length;
}

async function checkDiscountPages() {
  await inBatches(ALL_PREMIUM_SLUGS, async (slug) => {
    const scope = `/${slug}?discount=on`;
    const product = PROMOTIONAL.find((candidate) => candidate.entitlements.includes(slug));
    if (!product) {
      fail(scope, "discount product is missing from the catalogue");
      return;
    }
    try {
      const response = await fetchWithTimeout(`${BASE_URL}${scope}`);
      if (!response.ok) {
        fail(scope, `HTTP ${response.status}`);
        return;
      }
      const html = await response.text();
      if (!html.includes(product.id)) fail(scope, `missing discount product ${product.id}`);
      if (!html.includes(product.price)) fail(scope, `missing discount price ${product.price}`);
      if (product.compareAt && !html.includes(product.compareAt)) {
        fail(scope, `missing comparison price ${product.compareAt}`);
      }
    } catch (error) {
      fail(scope, error instanceof Error ? error.message : "request failed");
    }
  });
}

async function checkLegacyLocaleRedirects() {
  const slug = ALL_PREMIUM_SLUGS[0];
  const cases = [
    ["en-US", `/${slug}`],
    ["en_GB", `/${slug}`],
    ["en-AU", `/${slug}`],
    ["es-ES", `/es/${slug}`],
    ["pt-BR", `/pt_BR/${slug}`],
    ["zh-TW", `/zh_TW/${slug}`],
  ];

  for (const [locale, expectedPath] of cases) {
    const scope = `legacy locale ${locale}`;
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/${slug}?lang=${encodeURIComponent(locale)}`,
        { redirect: "manual" },
      );
      const location = response.headers.get("location");
      if (response.status !== 308) fail(scope, `expected HTTP 308, received ${response.status}`);
      if (!location || new URL(location, BASE_URL).pathname !== expectedPath) {
        fail(scope, `expected ${expectedPath}, received ${location || "no Location header"}`);
      }
    } catch (error) {
      fail(scope, error instanceof Error ? error.message : "request failed");
    }
  }
}

async function checkCheckoutApiPreflight() {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/creem/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const body = await response.json().catch(() => ({}));
    if (response.status !== 400 || body.error !== "key and productId are required") {
      fail("checkout API", `unexpected preflight response: HTTP ${response.status}`);
    }
  } catch (error) {
    fail("checkout API", error instanceof Error ? error.message : "request failed");
  }
}

async function checkCreemCatalogue() {
  if (!CREEM_API_KEY) {
    console.warn("Creem catalogue check skipped: CREEM_API_KEY is not configured.");
    return 0;
  }

  const response = await fetchWithTimeout(
    `${CREEM_API_URL}/products/search?page_number=1&page_size=100`,
    { headers: { "x-api-key": CREEM_API_KEY } },
  );
  if (!response.ok) {
    fail("Creem catalogue", `HTTP ${response.status}`);
    return 0;
  }

  const data = await response.json();
  const products = new Map((data.items || []).map((product) => [product.id, product]));
  const expected = [...SELLABLE, ...PROMOTIONAL];

  for (const product of expected) {
    const actual = products.get(product.id);
    if (!actual) {
      fail("Creem catalogue", `missing ${product.id}`);
      continue;
    }
    if (String(actual.status).toLowerCase() !== "active") {
      fail(product.id, `status is ${actual.status}`);
    }
    if (actual.price !== product.amount) {
      fail(product.id, `price is ${actual.price}, expected ${product.amount}`);
    }
    if (actual.billing_type !== product.billingType) {
      fail(product.id, `billing type is ${actual.billing_type}, expected ${product.billingType}`);
    }
    if (actual.billing_period !== product.billingPeriod) {
      fail(product.id, `billing period is ${actual.billing_period}, expected ${product.billingPeriod}`);
    }
  }

  return expected.length;
}

const localizedPages = await checkProductPages();
await checkDiscountPages();
await checkLegacyLocaleRedirects();
await checkCheckoutApiPreflight();
const creemProducts = await checkCreemCatalogue();

if (failures.length) {
  console.error(`Checkout smoke test failed with ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Checkout smoke test passed: ${localizedPages} localized pages, ` +
  `${ALL_PREMIUM_SLUGS.length} discount routes, 6 legacy redirects, ` +
  `checkout API preflight${creemProducts ? `, and ${creemProducts} Creem products` : ""}.`,
);
