/**
 * Creates missing 3-day, monthly, and lifetime Creem products for every paid extension,
 * then writes the real product ids back into lib/products.ts.
 *
 * Products with a real id are skipped, so re-running is safe: it only fills in
 * the ones still holding a PLACEHOLDER id.
 *
 *   CREEM_API_KEY=... node scripts/create-creem-products.mjs --dry-run
 *   CREEM_API_KEY=... node scripts/create-creem-products.mjs
 *
 * Creem prices are fixed per product, so a price change means a new product.
 * Never edit or delete a product customers already bought — retire it instead.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const API_KEY = process.env.CREEM_API_KEY || "";
const API_URL = (process.env.CREEM_API_URL || "https://api.creem.io/v1").replace(/\/$/, "");
const DRY_RUN = process.argv.includes("--dry-run");
const PRODUCTS_FILE = resolve(process.cwd(), "lib/products.ts");
const PLACEHOLDER = "prod_PLACEHOLDER_";

if (!API_KEY && !DRY_RUN) throw new Error("CREEM_API_KEY is required");

const source = await readFile(PRODUCTS_FILE, "utf8");

/**
 * Read the catalogue's own trio(...) calls, so the Creem product name matches
 * the name shown on the site exactly.
 */
const pending = [];
const trios = source.matchAll(
  /trio\(\s*"([^"]+)",\s*"([^"]+)",\s*\{ id: "([^"]+)", price: "\$([0-9.]+)", amount: (\d+) \},\s*\{ id: "([^"]+)", price: "\$([0-9.]+)", amount: (\d+) \},\s*\{ id: "([^"]+)", price: "\$([0-9.]+)", amount: (\d+) \},/g,
);
for (const [, , name, hotId, hotPrice, hotAmount, monthlyId, monthlyPrice, monthlyAmount, lifetimeId, lifetimePrice, lifetimeAmount] of trios) {
  if (hotId.startsWith(PLACEHOLDER)) {
    pending.push({
      id: hotId,
      tool: name,
      name: `${name} — 3-Day Pass`,
      price: hotPrice,
      amount: Number(hotAmount),
      access: "pass",
    });
  }
  if (monthlyId.startsWith(PLACEHOLDER)) {
    pending.push({
      id: monthlyId,
      tool: name,
      name: `${name} — Monthly`,
      price: monthlyPrice,
      amount: Number(monthlyAmount),
      access: "subscription",
    });
  }
  if (lifetimeId.startsWith(PLACEHOLDER)) {
    pending.push({
      id: lifetimeId,
      tool: name,
      name: `${name} — Lifetime`,
      price: lifetimePrice,
      amount: Number(lifetimeAmount),
      access: "lifetime",
    });
  }
}

if (pending.length === 0) {
  console.log("Nothing to do — every product already has a real Creem id.");
  process.exit(0);
}

async function createProduct(item) {
  const body = {
    name: item.name,
    // Creem requires a description; it is shown on the checkout page.
    description: item.access === "subscription"
      ? `Monthly access to ${item.tool}. Renews until you cancel.`
      : item.access === "pass"
        ? `Full Pro access to ${item.tool} for 3 days. One-time payment, no renewal.`
        : `Lifetime access to ${item.tool}. One-time payment, no renewal.`,
    price: item.amount,
    currency: "USD",
    billing_type: item.access === "subscription" ? "recurring" : "onetime",
    ...(item.access === "subscription" ? { billing_period: "every-month" } : {}),
  };

  if (DRY_RUN) {
    console.log("would create:", JSON.stringify(body));
    return `prod_DRYRUN_${item.id.slice(PLACEHOLDER.length)}`;
  }

  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Creem rejected ${item.id} (${response.status}): ${await response.text()}`,
    );
  }
  const created = await response.json();
  const id = created.id || created.product?.id;
  if (!id) throw new Error(`Creem returned no product id for ${item.id}`);
  return id;
}

let patched = source;
for (const item of pending) {
  const id = await createProduct(item);
  console.log(`${item.id}  →  ${id}  ($${item.price}${item.access === "subscription" ? "/mo" : ""})`);
  patched = patched.replaceAll(`"${item.id}"`, `"${id}"`);
  // Persist each successful id immediately. If Creem rejects a later product,
  // rerunning resumes safely instead of creating duplicates for earlier ones.
  if (!DRY_RUN) await writeFile(PRODUCTS_FILE, patched);
}

if (DRY_RUN) {
  console.log(`\nDry run: ${pending.length} products would be created.`);
} else {
  console.log(`\nWrote ${pending.length} real product ids into lib/products.ts.`);
  console.log("Commit that change, then deploy.");
}
