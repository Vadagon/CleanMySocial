/**
 * Rewrites the description of every product currently on sale in Creem to the
 * shared wording in creem-descriptions.mjs.
 *
 * Only `description` is sent. Creem treats a supplied `price` as a new price,
 * so nothing else may ever be added to the request body. Retired products are
 * left alone: they are not sold and their buyers already hold a licence.
 *
 *   node --env-file=.env scripts/update-creem-descriptions.mjs            # dry run
 *   node --env-file=.env scripts/update-creem-descriptions.mjs --apply
 *   node --env-file=.env scripts/update-creem-descriptions.mjs --apply --only prod_…
 */
import { PRODUCTS, PLACEHOLDER_PREFIX } from "../lib/products.ts";
import { creemDescription } from "./creem-descriptions.mjs";

const API_KEY = process.env.CREEM_API_KEY || "";
const API_URL = (process.env.CREEM_API_URL || "https://api.creem.io/v1").replace(/\/$/, "");
const APPLY = process.argv.includes("--apply");
const onlyIndex = process.argv.indexOf("--only");
const ONLY = onlyIndex > 0 ? process.argv[onlyIndex + 1] : "";

if (!API_KEY) throw new Error("CREEM_API_KEY is required");

async function creem(method, path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(`Creem ${method} ${path} → ${response.status}: ${await response.text()}`);
  return response.json();
}

const onSale = PRODUCTS.filter((product) =>
  !product.retired && !product.id.startsWith(PLACEHOLDER_PREFIX) && (!ONLY || product.id === ONLY),
);

let changed = 0;
for (const product of onSale) {
  const description = creemDescription({
    slug: product.entitlements[0],
    // "Messenger Cleaner — 3-Day Pass" → "Messenger Cleaner"
    tool: product.name.split(" — ")[0],
    access: product.access,
    promotion: product.promotion,
  });
  const live = await creem("GET", `/products?product_id=${encodeURIComponent(product.id)}`);
  // The catalogue is the authority on price. A mismatch means this id is not
  // the product we think it is, and it must not be touched.
  if (live.price !== product.amount) {
    throw new Error(`${product.id} is ${live.price} in Creem but ${product.amount} in lib/products.ts`);
  }
  if (live.description === description) {
    console.log(`same     ${product.id}  ${product.name}`);
    continue;
  }
  changed++;
  if (!APPLY) {
    console.log(`would    ${product.id}  ${product.name}\n         was: ${JSON.stringify(live.description)}`);
    continue;
  }
  const updated = await creem("PATCH", `/products/${product.id}`, { description });
  if (updated.description !== description || updated.price !== product.amount || updated.name !== live.name) {
    throw new Error(`${product.id} did not come back as expected: ${JSON.stringify(updated)}`);
  }
  console.log(`updated  ${product.id}  ${product.name}`);
}

console.log(`\n${onSale.length} products on sale, ${changed} ${APPLY ? "updated" : "would change"}.`);
