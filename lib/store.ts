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

export const storeConfigured = useRedis;
