import { NextRequest, NextResponse } from "next/server";
import {
  activeEntitlementsOf,
  entitles,
  grantFor,
  getLicense,
  isActive,
  subscriptionsEnforced,
} from "@/lib/license";
import { maybeSweep } from "@/lib/sweep";
import { ALL_PREMIUM_SLUGS } from "@/lib/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The extension calls this from its content script, so allow cross-origin
// reads. Access is gated by knowing the license key.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

/**
 * Slugs an extension may identify itself with, mapped to the entitlement it
 * needs. Every published extension currently asks as "cleanmysocial" — the
 * group — which says nothing about *which* tool is asking; those callers are
 * handled separately below.
 */
const SLUG_ALIASES: Record<string, string> = {
  "messenger-cleaner": "facebook-instagram-cleaner",
  "facebook-instagram-cleaner": "facebook-instagram-cleaner",
  "facebook-messenger-cleaner": "facebook-messenger-cleaner",
  "mass-friends-remover": "mass-unfriender",
  "mass-unfriender": "mass-unfriender",
  "instagram-dm-cleaner": "instagram-dm-cleaner",
  "followers-tracker": "instagram-followers-tracker",
  "ig-followers-tracker": "instagram-followers-tracker",
  "instagram-followers-tracker": "instagram-followers-tracker",
  "reddit-cleaner": "reddit-cleaner",
  cleanerx: "cleanerx",
  "facebook-activity-cleaner": "facebook-activity-cleaner",
  "fb-activity-cleaner": "facebook-activity-cleaner",
};

const GROUP = "cleanmysocial";
const DAY_MS = 24 * 60 * 60 * 1000;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const requested = searchParams.get("extension") || searchParams.get("ext");

  if (!key || !requested) {
    return NextResponse.json(
      {
        active: false,
        result: false,
        expiresAt: null,
        expireAt: null,
        error: "key and extension are required",
      },
      { status: 400, headers: CORS },
    );
  }

  const slug = SLUG_ALIASES[requested];
  const normalizedKey = key.trim().toLowerCase();
  const masterKey = process.env.MASTER_LICENSE_KEY?.trim().toLowerCase();
  const masterPrefix = process.env.MASTER_LICENSE_PREFIX?.trim().toLowerCase();
  const matchesMasterKey = Boolean(masterKey && normalizedKey === masterKey);
  const matchesUniqueMasterKey = Boolean(
    masterPrefix &&
      normalizedKey.startsWith(masterPrefix) &&
      normalizedKey.length > masterPrefix.length,
  );
  if (matchesMasterKey || matchesUniqueMasterKey) {
    return NextResponse.json(
      {
        active: true,
        result: true,
        extension: slug || requested,
        entitlements: ALL_PREMIUM_SLUGS,
        plan: "master",
        access: "lifetime",
        expiresAt: null,
        expireAt: null,
        subscriptionStatus: null,
        subscriptionsEnforced,
      },
      { headers: CORS },
    );
  }

  // Records are stored per licence group, not per extension.
  const license = await getLicense(GROUP, key);
  const entitlements = activeEntitlementsOf(license);

  // A caller that names itself gets a precise answer. A caller that only says
  // "cleanmysocial" cannot be identified, so it gets the permissive one — any
  // entitlement counts. Every extension in the wild today is in that second
  // group; they become precise as updated versions roll out.
  const active = slug
    ? entitles(license, slug)
    : isActive(license) && entitlements.length > 0;
  const grant = slug ? grantFor(license, slug) : null;
  const expiresAt = slug
    ? grant?.accessExpiresAt ?? grant?.currentPeriodEnd ?? license?.expiresAt ?? null
    : license?.expiresAt ?? null;
  // `expiresAt` remains the billing period end used for display. `expireAt` is
  // the effective access boundary extensions use for stale-cache protection;
  // past-due subscriptions include the server's seven-day grace period.
  const expireAt =
    grant?.subscriptionStatus === "past_due" && grant.currentPeriodEnd
      ? grant.currentPeriodEnd + 7 * DAY_MS
      : expiresAt;

  // This route is polled by every installed extension, which makes it the most
  // reliable clock we have. The lock inside maybeSweep means at most one caller
  // per hour does any work; everyone else pays a single Redis round trip.
  await maybeSweep();

  return NextResponse.json(
    {
      active,
      // legacy field name some callers may expect
      result: active,
      extension: slug || GROUP,
      // Lets an updated extension gate itself precisely even when it asked
      // with the generic group name.
      entitlements,
      plan: license?.plan ?? null,
      access: grant?.access ?? license?.access ?? null,
      expiresAt,
      expireAt,
      subscriptionStatus: grant?.subscriptionStatus ?? null,
      subscriptionsEnforced,
    },
    { headers: CORS },
  );
}
