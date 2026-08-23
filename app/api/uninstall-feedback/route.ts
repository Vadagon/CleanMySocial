import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getExtension } from "@/lib/extensions";
import { kvIncrementWithTtl, kvSet } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_096;
const RATE_WINDOW_SECONDS = 60 * 60;
const RATE_LIMIT = 20;
const RETENTION_SECONDS = 180 * 24 * 60 * 60;
const REASONS = new Set([
  "not_working",
  "hard_to_use",
  "too_slow",
  "missing_feature",
  "price",
  "privacy",
  "one_time",
  "mistake",
  "switched_tool",
  "other",
]);
const HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function clientBucket(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 20);
}

export async function POST(req: NextRequest) {
  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413, headers: HEADERS });
  }

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413, headers: HEADERS });
  }

  let payload: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid shape");
    payload = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400, headers: HEADERS });
  }

  const extension = clean(payload.extension, 60);
  const reason = clean(payload.reason, 40);
  const version = clean(payload.version, 40) || "unknown";
  const comment = clean(payload.comment, 1000);
  if (!getExtension(extension) || !REASONS.has(reason)) {
    return NextResponse.json({ ok: false, error: "invalid_feedback" }, { status: 400, headers: HEADERS });
  }

  const count = await kvIncrementWithTtl(
    `uninstall-feedback:rate:${clientBucket(req)}`,
    RATE_WINDOW_SECONDS,
  ).catch(() => 1);
  if (count > RATE_LIMIT) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { ...HEADERS, "Retry-After": String(RATE_WINDOW_SECONDS) } },
    );
  }

  const id = randomUUID();
  const receivedAt = new Date().toISOString();
  try {
    await kvSet(
      `uninstall-feedback:${Date.now()}:${id}`,
      JSON.stringify({ id, extension, version, reason, comment: comment || null, receivedAt }),
      RETENTION_SECONDS,
    );
    return NextResponse.json({ ok: true }, { status: 202, headers: HEADERS });
  } catch (error) {
    console.error("[api/uninstall-feedback] failed to persist feedback", error);
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503, headers: HEADERS });
  }
}
