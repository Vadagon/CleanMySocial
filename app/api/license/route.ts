import { NextRequest, NextResponse } from "next/server";
import {
  activeEntitlementsOf,
  activeGrantFor,
  entitles,
  getLicense,
  isActive,
  subscriptionsEnforced,
} from "@/lib/license";
import { maybeSweep } from "@/lib/sweep";
import { BUNDLE_ENTITLEMENTS } from "@/lib/products";

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
};

const GROUP = "cleanmysocial";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const requested = searchParams.get("extension") || searchParams.get("ext");

  if (!key || !requested) {
    return NextResponse.json(
      { active: false, error: "key and extension are required" },
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
        entitlements: BUNDLE_ENTITLEMENTS,
        plan: "master",
        access: "lifetime",
        expiresAt: null,
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
  const grant = slug ? activeGrantFor(license, slug) : null;

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
      expiresAt: slug
        ? grant?.currentPeriodEnd ?? license?.expiresAt ?? null
        : license?.expiresAt ?? null,
      subscriptionStatus: grant?.subscriptionStatus ?? null,
      subscriptionsEnforced,
    },
    { headers: CORS },
  );
}
