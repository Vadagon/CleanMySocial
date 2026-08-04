import { NextRequest, NextResponse } from "next/server";
import { getLicense, isActive } from "@/lib/license";

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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const requestedExtension =
    searchParams.get("extension") || searchParams.get("ext");
  const extension = requestedExtension
    ? ["messenger-cleaner", "mass-unfriender", "mass-friends-remover", "cleanmysocial"].includes(requestedExtension)
      ? "cleanmysocial"
      : requestedExtension
    : null;

  if (!key || !extension) {
    return NextResponse.json(
      { active: false, error: "key and extension are required" },
      { status: 400, headers: CORS }
    );
  }

  const license = await getLicense(extension, key);
  const active = isActive(license);

  return NextResponse.json(
    {
      active,
      // legacy field name some callers may expect
      result: active,
      extension,
      plan: license?.plan ?? null,
      access: license?.access ?? null,
      expiresAt: license?.expiresAt ?? null,
    },
    { headers: CORS }
  );
}
