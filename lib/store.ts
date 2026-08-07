// Minimal license store. Backed by Upstash Redis (REST) in production; falls
// back to an in-memory map for local dev (not persistent across serverless
// invocations, so set the Upstash env vars before deploying).

// Accept either the Vercel KV integration vars (KV_REST_API_*) or the raw
// Upstash vars (UPSTASH_REDIS_REST_*) — whichever the environment provides.
const URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

const memory = new Map<string, string>();
const useRedis = Boolean(URL && TOKEN);

async function redis(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Upstash error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { result: unknown };
  return json.result;
}

/**
 * Run many commands in one round trip. Falls back to sequential local reads
 * when Redis is not configured. Individual command errors come back as null
 * rather than throwing, so one bad key cannot sink the whole batch.
 */
async function redisPipeline(
  commands: (string | number)[][]
): Promise<unknown[]> {
  if (commands.length === 0) return [];
  const res = await fetch(`${URL.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Upstash error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { result?: unknown; error?: string }[];
  return json.map((entry) => (entry && "result" in entry ? entry.result : null));
}

export async function kvGet(key: string): Promise<string | null> {
  if (!useRedis) return memory.get(key) ?? null;
  const result = await redis(["GET", key]);
  return (result as string | null) ?? null;
}

/** Set a value with an optional TTL in seconds (omit for no expiry). */
export async function kvSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> {
  if (!useRedis) {
    memory.set(key, value);
    return;
  }
  const cmd: (string | number)[] = ["SET", key, value];
  if (ttlSeconds && ttlSeconds > 0) cmd.push("EX", ttlSeconds);
  await redis(cmd);
}

/**
 * Set only if the key does not exist. Returns true when this caller won the
 * race — the basis for a distributed once-per-interval lock.
 */
export async function kvSetNx(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<boolean> {
  if (!useRedis) {
    if (memory.has(key)) return false;
    memory.set(key, value);
    return true;
  }
  const result = await redis(["SET", key, value, "NX", "EX", ttlSeconds]);
  return result === "OK";
}

export async function kvDel(key: string): Promise<void> {
  if (!useRedis) {
    memory.delete(key);
    return;
  }
  await redis(["DEL", key]);
}

/** Remaining TTL in seconds; -1 = no expiry, -2 = missing. */
export async function kvTtl(key: string): Promise<number> {
  if (!useRedis) return memory.has(key) ? -1 : -2;
  return Number(await redis(["TTL", key]));
}

/** Every key matching a glob pattern, walked with SCAN (never KEYS). */
export async function kvScan(pattern: string): Promise<string[]> {
  if (!useRedis) {
    const re = new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
    return [...memory.keys()].filter((k) => re.test(k));
  }
  const keys: string[] = [];
  let cursor = "0";
  do {
    const [next, batch] = (await redis([
      "SCAN",
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      250,
    ])) as [string, string[]];
    cursor = next;
    keys.push(...batch);
  } while (cursor !== "0");
  return keys;
}

/**
 * Value + remaining TTL for many keys at once. Used by the admin browser,
 * where reading a few hundred keys one at a time would be painfully slow.
 */
export async function kvGetManyWithTtl(
  keys: string[]
): Promise<{ key: string; value: string | null; ttl: number }[]> {
  if (keys.length === 0) return [];
  if (!useRedis) {
    return keys.map((key) => ({
      key,
      value: memory.get(key) ?? null,
      ttl: memory.has(key) ? -1 : -2,
    }));
  }

  const out: { key: string; value: string | null; ttl: number }[] = [];
  // Chunked so a very large keyspace never produces one enormous request.
  const CHUNK = 100;
  for (let i = 0; i < keys.length; i += CHUNK) {
    const batch = keys.slice(i, i + CHUNK);
    const commands = batch.flatMap((k) => [
      ["GET", k],
      ["TTL", k],
    ]);
    const results = await redisPipeline(commands);
    batch.forEach((key, idx) => {
      const value = results[idx * 2];
      const ttl = Number(results[idx * 2 + 1]);
      out.push({
        key,
        value: typeof value === "string" ? value : null,
        ttl: Number.isFinite(ttl) ? ttl : -2,
      });
    });
  }
  return out;
}

export const storeConfigured = useRedis;
