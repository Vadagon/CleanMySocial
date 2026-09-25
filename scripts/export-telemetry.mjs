#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

/**
 * Exports raw funnel installations and crash events from production Redis to
 * local JSON files for analysis. Read-only: it authenticates with
 * KV_REST_API_READ_ONLY_TOKEN and only issues SCAN and GET, so it cannot change
 * data even by mistake. See docs/DATA-ACCESS.md.
 *
 * Usage:
 *   npm run export:telemetry                               # every extension
 *   npm run export:telemetry -- --extension mass-unfriender
 *   npm run export:telemetry -- --out ~/Desktop/cms-data
 */

const URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
const TOKEN = process.env.KV_REST_API_READ_ONLY_TOKEN || "";

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index > 0 ? process.argv[index + 1] : undefined;
}

const extension = arg("extension");
const outDir = path.resolve(arg("out") || "telemetry-export");

if (!URL || !TOKEN) {
  console.error("KV_REST_API_URL and KV_REST_API_READ_ONLY_TOKEN must be set in .env");
  process.exit(1);
}

async function call(body, suffix = "") {
  const response = await fetch(`${URL}${suffix}`, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Upstash ${response.status}: ${await response.text()}`);
  return response.json();
}

async function scan(match) {
  const keys = [];
  let cursor = "0";
  do {
    const { result } = await call(["SCAN", cursor, "MATCH", match, "COUNT", "1000"]);
    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== "0");
  return keys.sort();
}

async function readAll(keys) {
  const rows = [];
  for (let index = 0; index < keys.length; index += 200) {
    const batch = keys.slice(index, index + 200);
    const results = await call(batch.map((key) => ["GET", key]), "/pipeline");
    results.forEach((entry, offset) => {
      if (entry?.result) rows.push({ key: batch[offset], ...JSON.parse(entry.result) });
    });
  }
  return rows;
}

// Funnel keys carry the slug; crash keys are timestamped, so filter after reading.
const installations = await readAll(await scan(`funnel:install:${extension ? `${extension}:` : ""}*`));
const crashes = (await readAll(await scan("crash:event:*")))
  .filter((event) => !extension || event.extension === extension);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "installations.json"), JSON.stringify(installations, null, 2));
fs.writeFileSync(path.join(outDir, "crashes.json"), JSON.stringify(crashes, null, 2));
console.log(`${installations.length} installations, ${crashes.length} crash events → ${outDir}`);
