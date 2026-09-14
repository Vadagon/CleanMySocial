import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Released extension versions may continue calling this legacy endpoint.
// A successful empty response stops retries without parsing, storing, scanning,
// deduplicating, or emailing the report.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export function POST() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
