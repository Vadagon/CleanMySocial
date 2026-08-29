import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, checkAdminToken, tokenFromRequest } from "@/lib/admin";
import { listUninstallFeedback } from "@/lib/uninstall-feedback";
import { dashboardFiltersFromSearchParams } from "@/lib/dashboard-filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
};

export async function GET(req: NextRequest) {
  if (!adminConfigured) {
    return NextResponse.json({ error: "ADMIN_TOKEN is not set on the server" }, { status: 503, headers: HEADERS });
  }
  if (!checkAdminToken(tokenFromRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: HEADERS });
  }

  try {
    return NextResponse.json(
      await listUninstallFeedback(dashboardFiltersFromSearchParams(req.nextUrl.searchParams)),
      { headers: HEADERS },
    );
  } catch (error) {
    console.error("[admin/feedback] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to read feedback" },
      { status: 500, headers: HEADERS },
    );
  }
}
