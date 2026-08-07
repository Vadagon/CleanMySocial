import { timingSafeEqual } from "node:crypto";

/**
 * Shared secret for the private /vault browser. There is deliberately no
 * default: with ADMIN_TOKEN unset the admin endpoints refuse every request
 * rather than falling open.
 */
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

export const adminConfigured = Boolean(ADMIN_TOKEN);

export function checkAdminToken(supplied: string | null): boolean {
  if (!ADMIN_TOKEN || !supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(ADMIN_TOKEN);
  // timingSafeEqual throws on a length mismatch, so compare lengths first —
  // which leaks only the token's length, not its contents.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Token from the header, falling back to `?token=` for quick curl checks. */
export function tokenFromRequest(req: Request): string | null {
  const header = req.headers.get("x-admin-token");
  if (header) return header;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return new URL(req.url).searchParams.get("token");
}
