import { NextRequest, NextResponse } from "next/server";
import { getLicense, isActive } from "@/lib/license";
import { sendAbandonedCheckoutEmail, mailConfigured } from "@/lib/mail";
import { listPendingCheckouts, markReminded } from "@/lib/pending";
import { storeConfigured } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Sweeping + SMTP is slow; give it room beyond the 10s default.
export const maxDuration = 60;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Stop chasing after a week — by then the nudge is just noise. */
const GIVE_UP_MS = 7 * DAY_MS;

/**
 * Emails anyone who started checkout at least 24h ago and never paid — once.
 * Scheduled from vercel.json; protected by CRON_SECRET when that is set
 * (Vercel sends it as a bearer token on scheduled invocations).
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
    return NextResponse.json(
      { error: "store not configured" },
      { status: 503 },
    );
  }

  const now = Date.now();
  let considered = 0;
  let reminded = 0;
  let skippedPaid = 0;

  try {
    for (const record of await listPendingCheckouts()) {
      considered++;
      const age = now - record.createdAt;
      if (record.remindedAt) continue;
      if (age < DAY_MS || age > GIVE_UP_MS) continue;

      // Last line of defence: never nudge someone who actually paid (e.g. if
      // the webhook cleared late or not at all).
      const license = await getLicense(record.extension, record.key);
      if (isActive(license)) {
        skippedPaid++;
        continue;
      }

      if (!mailConfigured) continue;
      if (await sendAbandonedCheckoutEmail(record.email)) {
        await markReminded(record);
        reminded++;
      }
    }
  } catch (e) {
    console.error("[cron] abandoned-checkout sweep failed", e);
    return NextResponse.json({ error: "sweep failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    considered,
    reminded,
    skippedPaid,
    mailConfigured,
  });
}
