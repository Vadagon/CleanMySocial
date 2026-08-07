import { getLicense, isActive } from "./license";
import { sendAbandonedCheckoutEmail, mailConfigured } from "./mail";
import { listPendingCheckouts, markReminded } from "./pending";
import { kvSetNx, storeConfigured } from "./store";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Stop chasing after a week — by then the nudge is just noise. */
const GIVE_UP_MS = 7 * DAY_MS;

/** At most one automatic sweep per hour, across all instances. */
const LOCK_KEY = "sweep:abandoned";
const LOCK_TTL_SECONDS = 60 * 60;

/**
 * Per-record send claim. Outlives the pending record itself so a late retry
 * can never resurrect an email that already went out.
 */
const CLAIM_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Cap per run so a piggybacked sweep can never stall a user's request for
 * long. Leftovers are picked up by the next sweep an hour later.
 */
const DEFAULT_LIMIT = 5;

export interface SweepResult {
  ran: boolean;
  considered: number;
  reminded: number;
  skippedPaid: number;
  mailConfigured: boolean;
}

/**
 * Emails everyone who started checkout 24h–7d ago and never paid — once each.
 * Safe to call repeatedly: `remindedAt` on the record is the guard.
 */
export async function runAbandonedSweep(limit = DEFAULT_LIMIT): Promise<SweepResult> {
  const result: SweepResult = {
    ran: true,
    considered: 0,
    reminded: 0,
    skippedPaid: 0,
    mailConfigured,
  };
  const now = Date.now();

  for (const record of await listPendingCheckouts()) {
    result.considered++;
    if (result.reminded >= limit) continue;

    const age = now - record.createdAt;
    if (record.remindedAt) continue;
    if (age < DAY_MS || age > GIVE_UP_MS) continue;

    // Last line of defence: never nudge someone who actually paid (e.g. if the
    // webhook cleared the record late, or not at all).
    if (isActive(await getLicense(record.extension, record.key))) {
      result.skippedPaid++;
      continue;
    }

    if (!mailConfigured) continue;

    // Claim the send atomically before doing it. The hourly lock should already
    // make concurrent sweeps impossible, but a customer receiving the same
    // email five times is bad enough to warrant a second, independent guard.
    const claimed = await kvSetNx(
      `reminded:${record.extension}:${record.key}`,
      String(now),
      CLAIM_TTL_SECONDS,
    );
    if (!claimed) continue;

    if (await sendAbandonedCheckoutEmail(record.email)) {
      await markReminded(record);
      result.reminded++;
    }
  }

  return result;
}

/**
 * Traffic-driven scheduling: any request can offer to run the sweep, but the
 * Redis lock means only the first one each hour actually does. No scheduler of
 * any kind is involved — nothing to configure.
 *
 * Never throws — a failed sweep must not affect the request that triggered it.
 */
export async function maybeSweep(): Promise<SweepResult | null> {
  if (!storeConfigured || !mailConfigured) return null;
  try {
    const won = await kvSetNx(LOCK_KEY, String(Date.now()), LOCK_TTL_SECONDS);
    if (!won) return null;
    return await runAbandonedSweep();
  } catch (e) {
    console.error("[sweep] background sweep failed", e);
    return null;
  }
}
