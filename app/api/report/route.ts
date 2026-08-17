import { NextRequest, NextResponse } from "next/server";
import { sendBreakageReport } from "@/lib/mail";
import { prepareCrash, saveCrash } from "@/lib/crashes";
import { kvSetNx } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Called by extensions from the background service worker, so the origin is a
// chrome-extension:// URL. Nothing sensitive is read back, so a permissive
// origin is safe here; accepted diagnostics are now also retained for /crash.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

/**
 * Failure codes an extension may report. A closed list keeps the endpoint from
 * becoming a channel for arbitrary text, and keeps user data out by
 * construction — there is no free-form field anywhere in the payload.
 */
const CODES = new Set([
  "no_friend_list",
  "bad_response",
  "graphql_error",
  "missing_token",
  "action_rejected",
  "load_failed",
]);

const EXTENSIONS = new Set([
  "mass-unfriender",
  "facebook-messenger-cleaner",
  "facebook-instagram-cleaner",
  "ig-followers-tracker",
  "instagram-dm-cleaner",
]);

/** One email per extension + failure per hour, however many users report it. */
const REPORT_WINDOW_SECONDS = 3600;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400, headers: CORS });
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const extension = clean(payload.extension, 60);
  const code = clean(payload.code, 60);

  if (!EXTENSIONS.has(extension) || !CODES.has(code)) {
    return NextResponse.json(
      { ok: false, error: "unknown_extension_or_code" },
      { status: 400, headers: CORS },
    );
  }

  const report = {
    extension,
    code,
    version: clean(payload.version, 20) || "unknown",
    locale: clean(payload.locale, 20) || "unknown",
    // Product and version only — the extension sends no user agent of its own.
    browser: clean(req.headers.get("user-agent"), 200) || "unknown",
  };

  // Keep the existing low-friction report button, but also make every report
  // visible in the crash dashboard. Storage failure must not block its email
  // fallback, which predates the dashboard.
  const crash = prepareCrash({
    extension,
    version: report.version,
    source: "manual-breakage-report",
    name: "PlatformBreakage",
    code,
    message: `Extension reported ${code}`,
    locale: report.locale,
    platform: report.browser,
  });
  if (!("error" in crash)) {
    await saveCrash(crash).catch((error) => console.error("[api/report] failed to persist crash", error));
  }

  // Deduplicate before sending: a Facebook-side change breaks the extension for
  // everyone at once, and one mailbox does not need thousands of copies.
  const fresh = await kvSetNx(
    `report:${extension}:${code}`,
    String(Date.now()),
    REPORT_WINDOW_SECONDS,
  ).catch(() => true);

  // The user is told their report was sent either way — from their side it was.
  if (!fresh) return NextResponse.json({ ok: true, deduped: true }, { headers: CORS });

  const sent = await sendBreakageReport(report);
  return NextResponse.json({ ok: true, sent }, { headers: CORS });
}
