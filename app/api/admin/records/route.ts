import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, checkAdminToken, tokenFromRequest } from "@/lib/admin";
import { listAllRecords, lookupLicenseKey } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Belt and braces alongside robots.txt: even if this URL leaks into a crawler's
// queue, the response itself says "do not index".
const HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
};

export async function GET(req: NextRequest) {
  if (!adminConfigured) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN is not set on the server" },
      { status: 503, headers: HEADERS }
    );
  }

  if (!checkAdminToken(tokenFromRequest(req))) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: HEADERS }
    );
  }

  const pattern = req.nextUrl.searchParams.get("pattern") || "*";
  // Support's first move is "paste the customer's key". Resolving it directly
  // avoids a full SCAN and answers the per-extension question exactly.
  const lookup = req.nextUrl.searchParams.get("key");

  try {
    if (lookup) {
      const record = await lookupLicenseKey(lookup);
      return NextResponse.json(
        { lookup: { key: lookup.trim().toLowerCase(), record } },
        { headers: HEADERS },
      );
    }

    const snapshot = await listAllRecords(pattern);
    return NextResponse.json(
      {
        ...snapshot,
        masterAccess: {
          exactKey: process.env.MASTER_LICENSE_KEY || null,
          prefix: process.env.MASTER_LICENSE_PREFIX || null,
        },
      },
      { headers: HEADERS },
    );
  } catch (e) {
    console.error("[admin/records] failed", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed to read store" },
      { status: 500, headers: HEADERS }
    );
  }
}
