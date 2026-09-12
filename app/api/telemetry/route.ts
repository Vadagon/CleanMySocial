import { createHash } from "node:crypto";
import { after, NextRequest, NextResponse } from "next/server";
import { maybeSendCrashAlerts } from "@/lib/crashes";
import { ingestTelemetryBatch, prepareTelemetryBatch, type TelemetryBatchInput } from "@/lib/telemetry";
import { kvIncrementWithTtl } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A batch carries up to 50 items, so it is roomier than single-error /api/crash. */
const MAX_BODY_BYTES = 65_536;
const RATE_WINDOW_SECONDS = 60;
const RATE_LIMIT = 120;
const INSTALLATION_RATE_LIMIT = 30;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function clientBucket(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 20);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413, headers: CORS });
  }

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413, headers: CORS });
  }

  let body: TelemetryBatchInput;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid shape");
    body = parsed as TelemetryBatchInput;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400, headers: CORS });
  }

  const count = await kvIncrementWithTtl(
    `telemetry:rate:${clientBucket(req)}`,
    RATE_WINDOW_SECONDS,
  ).catch(() => 1);
  if (count > RATE_LIMIT) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { ...CORS, "Retry-After": String(RATE_WINDOW_SECONDS) } },
    );
  }

  const batch = prepareTelemetryBatch(body);
  if ("error" in batch) {
    return NextResponse.json({ ok: false, error: batch.error }, { status: 400, headers: CORS });
  }

  if (batch.installationHash) {
    const installationCount = await kvIncrementWithTtl(
      `telemetry:rate:install:${batch.installationHash}`,
      RATE_WINDOW_SECONDS,
    ).catch(() => 1);
    if (installationCount > INSTALLATION_RATE_LIMIT) {
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        { status: 429, headers: { ...CORS, "Retry-After": String(RATE_WINDOW_SECONDS) } },
      );
    }
  }

  try {
    const result = await ingestTelemetryBatch(batch);
    after(async () => {
      for (const event of result.crashEvents) {
        await maybeSendCrashAlerts(event).catch((error) =>
          console.error("[api/telemetry] alert evaluation failed", error),
        );
      }
    });
    return NextResponse.json(
      {
        ok: true,
        // The client deletes exactly these IDs, so malformed and already-stored
        // items are listed too: neither should be retried forever.
        acceptedIds: result.acceptedIds,
        storedEvents: result.storedEvents,
        storedErrors: result.storedErrors,
        duplicates: result.duplicates,
        rejected: result.rejected,
      },
      { status: 202, headers: CORS },
    );
  } catch (error) {
    console.error("[api/telemetry] failed to persist batch", error);
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503, headers: CORS });
  }
}
