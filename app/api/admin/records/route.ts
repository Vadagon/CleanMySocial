import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, checkAdminToken, tokenFromRequest } from "@/lib/admin";
import { listAllRecords } from "@/lib/records";

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

  try {
    const snapshot = await listAllRecords(pattern);
    return NextResponse.json(snapshot, { headers: HEADERS });
  } catch (e) {
    console.error("[admin/records] failed", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed to read store" },
      { status: 500, headers: HEADERS }
    );
  }
}
