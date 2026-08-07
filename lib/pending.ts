import { kvDel, kvGet, kvScan, kvSet } from "./store";
import { normalizeKey } from "./license";

/**
 * A checkout that was started but not (yet) paid. Written when the buyer
 * presses Buy now, deleted as soon as the webhook grants their license. What
 * is left over after 24h is an abandoned checkout worth one polite nudge.
 */
export interface PendingCheckout {
  key: string;
  email: string;
  extension: string;
  plan: string;
  productId?: string;
  createdAt: number;
  /** set once the reminder has gone out, so nobody is nudged twice */
  remindedAt?: number;
}

export const PENDING_PREFIX = "pending:";
/** Drop the record after two weeks whatever happens. */
const PENDING_TTL_SECONDS = 14 * 24 * 60 * 60;

function pendingKey(extension: string, key: string) {
  return `${PENDING_PREFIX}${extension}:${normalizeKey(key)}`;
}

export async function recordPendingCheckout(
  input: Omit<PendingCheckout, "createdAt">,
): Promise<void> {
  const record: PendingCheckout = {
    ...input,
    key: normalizeKey(input.key),
    createdAt: Date.now(),
  };
  await kvSet(
    pendingKey(input.extension, input.key),
    JSON.stringify(record),
    PENDING_TTL_SECONDS,
  );
}

/** Called on a successful grant — a paid checkout is no longer abandoned. */
export async function clearPendingCheckout(
  extension: string,
  key: string,
): Promise<void> {
  await kvDel(pendingKey(extension, key));
}

export async function markReminded(record: PendingCheckout): Promise<void> {
  const updated: PendingCheckout = { ...record, remindedAt: Date.now() };
  await kvSet(
    pendingKey(record.extension, record.key),
    JSON.stringify(updated),
    PENDING_TTL_SECONDS,
  );
}

export async function listPendingCheckouts(): Promise<PendingCheckout[]> {
  const keys = await kvScan(`${PENDING_PREFIX}*`);
  const records: PendingCheckout[] = [];
  for (const k of keys) {
    const raw = await kvGet(k);
    if (!raw) continue;
    try {
      records.push(JSON.parse(raw) as PendingCheckout);
    } catch {
      // ignore an unparseable record rather than failing the whole sweep
    }
  }
  return records;
}
