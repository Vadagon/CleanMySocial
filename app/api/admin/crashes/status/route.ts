import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, checkAdminToken, tokenFromRequest } from "@/lib/admin";
import { isCrashIssueStatus, setCrashIssueStatus } from "@/lib/crash-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
};

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  if (!adminConfigured) {
    return NextResponse.json({ error: "ADMIN_TOKEN is not set on the server" }, { status: 503, headers: HEADERS });
  }
  if (!checkAdminToken(tokenFromRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: HEADERS });
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const extension = clean(body.extension, 80);
    const fingerprint = clean(body.fingerprint, 32).toLowerCase();
    if (!/^[a-z0-9-]+$/.test(extension) || !/^[a-f0-9]{16}$/.test(fingerprint) || !isCrashIssueStatus(body.status)) {
      return NextResponse.json({ error: "invalid issue status" }, { status: 400, headers: HEADERS });
    }
    return NextResponse.json(
      await setCrashIssueStatus(extension, fingerprint, body.status),
      { headers: HEADERS },
    );
  } catch (error) {
    console.error("[admin/crashes/status] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to update issue status" },
      { status: 500, headers: HEADERS },
    );
  }
}
