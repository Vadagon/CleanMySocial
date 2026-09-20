/**
 * A short-lived in-process cache for the admin dashboard's whole-keyspace reads.
 *
 * The dashboard reads every retained key and then filters in JavaScript, so a
 * change of extension, date range, version or locale produces the same Redis
 * traffic as a cold load — and the four panels reload together. At a few
 * thousand keys that is thousands of metered commands per dropdown click,
 * which is what exhausted the Upstash request quota.
 *
 * Caching the raw rows rather than the computed snapshot keeps the filtering
 * honest: every panel still recomputes from full data, it just stops asking
 * Redis for bytes it read a moment ago. The TTL is deliberately short — this
 * is a live health dashboard, and a stale funnel is worse than a slow one.
 *
 * Scope is one serverless instance. That is enough for the case that hurts
 * (one operator clicking through filters on a warm instance) and it needs no
 * invalidation: entries simply expire.
 */

import { createHash } from "node:crypto";

const DEFAULT_TTL_MS = 30_000;

/**
 * A stable cache key for "the rows behind exactly this key list". Some panels
 * narrow the key list by date before reading, so the cache entry has to be tied
 * to the list itself rather than to the filters that produced it.
 */
export function keyDigest(keys: string[]): string {
  return createHash("sha1").update(keys.join("\n")).digest("hex").slice(0, 16);
}

type Entry = { value: unknown; expiresAt: number };

const entries = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Which stored keys each cached group is derived from.
 *
 * Writes happen all over the codebase — the Creem webhook, the telemetry
 * ingest, the uninstall endpoint — so asking every writer to remember to
 * invalidate is a bug waiting to happen (and was: a purchase written straight
 * through the store left a stale funnel behind). Instead the store reports
 * every write here, and this table decides what it affects.
 */
const WATCHED: Record<string, string[]> = {
  "funnel:": ["funnel:install:", "purchase:creem:"],
  "crashes:": ["crash:event:"],
  "feedback:": ["uninstall-feedback:"],
  "emails:": ["email:"],
};

/** Called by the store on every write, whatever the writer. */
export function invalidateForStoreKey(key: string): void {
  if (entries.size === 0) return;
  for (const [group, prefixes] of Object.entries(WATCHED)) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) invalidateSnapshotCache(group);
  }
}

export function invalidateSnapshotCache(prefix?: string): void {
  if (!prefix) {
    entries.clear();
    return;
  }
  for (const key of entries.keys()) {
    if (key.startsWith(prefix)) entries.delete(key);
  }
}

/**
 * Returns the cached value for `key`, or loads it. Concurrent callers share one
 * load: the four dashboard panels fire together, and without this the first
 * uncached render would run the same scan several times over.
 */
export async function cachedRead<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const hit = entries.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const load = loader()
    .then((value) => {
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, load);
  return load as Promise<T>;
}
