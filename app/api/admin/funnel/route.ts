import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, checkAdminToken, tokenFromRequest } from "@/lib/admin";
import { dashboardFiltersFromSearchParams } from "@/lib/dashboard-filters";
import { listFunnel, type FunnelFilters } from "@/lib/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
};

function funnelFilters(searchParams: URLSearchParams): FunnelFilters {
  return {
    ...dashboardFiltersFromSearchParams(searchParams),
    version: searchParams.get("version")?.trim() || undefined,
    locale: searchParams.get("locale")?.trim() || undefined,
    view: searchParams.get("view") === "activity" ? "activity" : "cohort",
  };
}

export async function GET(req: NextRequest) {
  if (!adminConfigured) {
    return NextResponse.json({ error: "ADMIN_TOKEN is not set on the server" }, { status: 503, headers: HEADERS });
  }
  if (!checkAdminToken(tokenFromRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: HEADERS });
  }

  try {
    return NextResponse.json(await listFunnel(funnelFilters(req.nextUrl.searchParams)), { headers: HEADERS });
  } catch (error) {
    console.error("[admin/funnel] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to read the funnel" },
      { status: 500, headers: HEADERS },
    );
  }
}
