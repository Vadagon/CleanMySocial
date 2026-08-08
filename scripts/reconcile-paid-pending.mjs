#!/usr/bin/env node
/**
 * Promote owner-confirmed paid checkouts from pending to active licences.
 *
 * Nothing is inferred from an email address and a pending record alone is not
 * treated as proof of payment. Every key must be named explicitly after the
 * owner has reconciled it against Creem. Dry-run is the default.
 *
 *   node --env-file=.env scripts/reconcile-paid-pending.mjs --key <uuid>
 *   node --env-file=.env scripts/reconcile-paid-pending.mjs --key <uuid> --apply
 */

import net from "node:net";
import tls from "node:tls";
import { BUNDLE_ENTITLEMENTS, getProduct, mergeEntitlements } from "../lib/products.ts";

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const GROUP = "cleanmysocial";
const requestedKeys = process.argv.flatMap((arg, index, args) => {
  if (arg === "--key" && args[index + 1]) return [args[index + 1]];
  if (arg.startsWith("--key=")) return [arg.slice("--key=".length)];
  return [];
});

const normalize = (value) => String(value).trim().toLowerCase();
const keys = [...new Set(requestedKeys.map(normalize).filter(Boolean))];

if (!keys.length) {
  console.error("Name at least one owner-confirmed payment with --key <uuid>.");
  process.exit(1);
}
if (!process.env.REDIS_URL) {
  console.error("REDIS_URL is not configured.");
  process.exit(1);
}

function encodeCommand(parts) {
  return (
    `*${parts.length}\r\n` +
    parts
      .map((part) => {
        const value = String(part);
        return `$${Buffer.byteLength(value)}\r\n${value}\r\n`;
      })
      .join("")
  );
}

function parseReply(buffer, offset = 0) {
  if (offset >= buffer.length) return null;
  const prefix = String.fromCharCode(buffer[offset]);
  const lineEnd = buffer.indexOf("\r\n", offset);
  if (lineEnd < 0) return null;
  const line = buffer.toString("utf8", offset + 1, lineEnd);

  if (prefix === "+") return { value: line, next: lineEnd + 2 };
  if (prefix === "-") throw new Error(`Redis error: ${line}`);
  if (prefix === ":") return { value: Number(line), next: lineEnd + 2 };
  if (prefix === "$") {
    const length = Number(line);
    if (length === -1) return { value: null, next: lineEnd + 2 };
    const start = lineEnd + 2;
    const end = start + length;
    if (buffer.length < end + 2) return null;
    return { value: buffer.toString("utf8", start, end), next: end + 2 };
  }
  if (prefix === "*") {
    const count = Number(line);
    if (count === -1) return { value: null, next: lineEnd + 2 };
    const value = [];
    let next = lineEnd + 2;
    for (let index = 0; index < count; index++) {
      const parsed = parseReply(buffer, next);
      if (!parsed) return null;
      value.push(parsed.value);
      next = parsed.next;
    }
    return { value, next };
  }
  throw new Error(`Unknown Redis reply prefix: ${prefix}`);
}

async function connectRedis(redisUrl) {
  const url = new URL(redisUrl);
  const secure = url.protocol === "rediss:";
  if (!secure && url.protocol !== "redis:") {
    throw new Error("REDIS_URL must use redis:// or rediss://");
  }

  const socket = secure
    ? tls.connect({ host: url.hostname, port: Number(url.port || 6379), servername: url.hostname })
    : net.connect({ host: url.hostname, port: Number(url.port || 6379) });

  let buffered = Buffer.alloc(0);
  const waiters = [];
  socket.on("data", (chunk) => {
    buffered = Buffer.concat([buffered, chunk]);
    while (waiters.length) {
      let parsed;
      try {
        parsed = parseReply(buffered);
      } catch (error) {
        waiters.shift().reject(error);
        continue;
      }
      if (!parsed) break;
      buffered = buffered.subarray(parsed.next);
      waiters.shift().resolve(parsed.value);
    }
  });
  socket.on("error", (error) => {
    while (waiters.length) waiters.shift().reject(error);
  });

  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });

  const command = (...parts) =>
    new Promise((resolve, reject) => {
      waiters.push({ resolve, reject });
      socket.write(encodeCommand(parts));
    });

  await command(
    "AUTH",
    decodeURIComponent(url.username || "default"),
    decodeURIComponent(url.password),
  );
  return { command, close: () => socket.end() };
}

function parseJson(raw, label) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${label} contains invalid JSON`);
  }
}

const redis = await connectRedis(process.env.REDIS_URL);
try {
  const planned = [];
  for (const key of keys) {
    const pendingKey = `pending:${GROUP}:${key}`;
    const licenseKey = `license:${GROUP}:${key}`;
    const pending = parseJson(await redis.command("GET", pendingKey), pendingKey);
    const existing = parseJson(await redis.command("GET", licenseKey), licenseKey);

    if (VERIFY) {
      if (pending) throw new Error(`${pendingKey} still exists`);
      if (!existing || existing.expiresAt !== null || existing.access !== "lifetime") {
        throw new Error(`${licenseKey} is not an active lifetime licence`);
      }
      if (existing.manualCompletionSource !== "owner-confirmed-creem-payment") {
        throw new Error(`${licenseKey} is missing its manual completion audit marker`);
      }
      console.log(
        `${key}: VERIFIED active; entitlements=${(existing.entitlements || []).join(",")}`,
      );
      continue;
    }

    if (!pending) throw new Error(`${pendingKey} does not exist`);
    if (normalize(pending.key) !== key) throw new Error(`${pendingKey} has a mismatched key`);
    if (pending.extension !== GROUP) throw new Error(`${pendingKey} has an unexpected group`);

    const product = pending.productId ? getProduct(pending.productId) : undefined;
    if (!product || product.retired) {
      throw new Error(`${pendingKey} does not name a currently recognized product`);
    }

    const entitlements = existing
      ? mergeEntitlements(existing.entitlements || BUNDLE_ENTITLEMENTS, product.entitlements)
      : [...product.entitlements];
    const products = [
      ...(existing?.products || []),
      ...(!existing?.products?.includes(product.id) ? [product.id] : []),
    ];
    const now = Date.now();
    const license = {
      ...(existing || {}),
      key,
      extension: GROUP,
      plan: product.kind,
      access: "lifetime",
      expiresAt: null,
      updatedAt: now,
      email: pending.email || existing?.email,
      entitlements,
      products,
      manuallyCompletedAt: now,
      manualCompletionSource: "owner-confirmed-creem-payment",
    };

    planned.push({ key, pendingKey, licenseKey, license, product });
  }

  if (VERIFY) {
    console.log("All requested licences verified and no matching pending records remain.");
    process.exitCode = 0;
  } else {
    console.log(APPLY ? "MODE: APPLY" : "MODE: DRY RUN");
  }
  for (const item of planned) {
    console.log(
      `${item.key}: ${item.product.name} -> ${item.license.entitlements.join(", ")}`,
    );
  }

  if (VERIFY) {
    // The verification output above is intentionally the only output.
  } else if (!APPLY) {
    console.log("No records changed. Re-run with --apply after review.");
  } else {
    for (const item of planned) {
      await redis.command("MULTI");
      await redis.command("SET", item.licenseKey, JSON.stringify(item.license));
      await redis.command("DEL", item.pendingKey);
      const result = await redis.command("EXEC");
      if (!Array.isArray(result)) throw new Error(`transaction failed for ${item.key}`);
      console.log(`${item.key}: active licence written and pending record cleared`);
    }
  }
} finally {
  redis.close();
}
