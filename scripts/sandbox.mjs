#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Runs `next <command>` with every Redis credential blanked, so lib/store.ts
 * falls back to its in-memory map and nothing can touch production data.
 *
 * .env holds the live credentials. @next/env never overrides a variable that is
 * already present in process.env — an empty string included — so presetting
 * these to "" wins over .env.
 *
 * Usage: node scripts/sandbox.mjs dev [next args...]
 */

const BLANKED = [
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "KV_REST_API_READ_ONLY_TOKEN",
  "KV_URL",
  "REDIS_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

const env = { ...process.env };
for (const name of BLANKED) env[name] = "";
// A throwaway token so the sandbox dashboards never accept the production one.
env.ADMIN_TOKEN = "sandbox-admin-token";

const next = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [next, ...process.argv.slice(2)], { env, stdio: "inherit" });
child.on("exit", (code, signal) => (signal ? process.kill(process.pid, signal) : process.exit(code ?? 0)));
