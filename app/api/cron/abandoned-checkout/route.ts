import { NextRequest, NextResponse } from "next/server";
import { runAbandonedSweep } from "@/lib/sweep";
import { storeConfigured } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Sweeping + SMTP is slow; give it room beyond the default.
export const maxDuration = 60;

/**
 * Manual / external trigger for the abandoned-checkout sweep.
 *
 * Normally nothing calls this: the sweep rides along on ordinary traffic (see
 * lib/sweep.ts), so it needs no platform cron. Kept for forcing a run by hand,
 * or for pointing an external scheduler at if you ever want fixed timing.
 *
 * Protected by CRON_SECRET when that is set.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!storeConfigured) {
    return NextResponse.json({ error: "store not configured" }, { status: 503 });
  }

  try {
    // A manual run is not latency-sensitive, so let it clear the whole backlog.
    return NextResponse.json({ ok: true, ...(await runAbandonedSweep(100)) });
  } catch (e) {
    console.error("[cron] abandoned-checkout sweep failed", e);
    return NextResponse.json({ error: "sweep failed" }, { status: 500 });
  }
}
