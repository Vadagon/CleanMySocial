import { NextRequest, NextResponse } from "next/server";
import { verifyCreemRedirect } from "@/lib/creem-redirect";
import { fulfillPaidProduct } from "@/lib/fulfillment";
import { isValidEmail } from "@/lib/mail";
import { getPendingCheckout } from "@/lib/pending";
import { getProduct } from "@/lib/products";
import { CREEM } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckoutRecord {
  id?: string;
  status?: string;
  request_id?: string;
  product?: string | { id?: string };
  product_id?: string;
  customer?: { email?: string };
  customer_email?: string;
  metadata?: { email?: string; key?: string; product_id?: string };
}

function productIdOf(checkout: CheckoutRecord): string | undefined {
  if (checkout.product_id) return checkout.product_id;
  if (typeof checkout.product === "string") return checkout.product;
  return checkout.product?.id;
}

/**
 * Recovery path for a successful checkout when webhook delivery is delayed or
 * misconfigured. Both the signed browser return and Creem's API must agree
 * before this route grants anything.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  if (!CREEM.apiKey || !verifyCreemRedirect(params.entries(), CREEM.apiKey)) {
    console.error("[creem] checkout return signature rejected", {
      apiKeyConfigured: Boolean(CREEM.apiKey),
      signaturePresent: params.has("signature"),
    });
    return NextResponse.json({ error: "invalid confirmation" }, { status: 401 });
  }

  const checkoutId = params.get("checkout_id") || "";
  const requestId = params.get("request_id") || "";
  const returnedProductId = params.get("product_id") || "";
  if (!checkoutId || !requestId || !returnedProductId) {
    return NextResponse.json({ error: "incomplete confirmation" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${CREEM.apiUrl}/checkouts?checkout_id=${encodeURIComponent(checkoutId)}`,
      {
        headers: { "x-api-key": CREEM.apiKey },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      console.error("[creem] checkout confirmation lookup failed", response.status);
      return NextResponse.json({ error: "confirmation unavailable" }, { status: 502 });
    }

    const payload = (await response.json()) as CheckoutRecord & { data?: CheckoutRecord };
    const checkout: CheckoutRecord = payload.data || payload;
    const checkoutProductId = productIdOf(checkout);
    if (
      checkout.id !== checkoutId ||
      checkout.status !== "completed" ||
      checkout.request_id !== requestId ||
      checkoutProductId !== returnedProductId
    ) {
      console.error("[creem] checkout confirmation mismatch", {
        checkoutIdMatches: checkout.id === checkoutId,
        status: checkout.status,
        requestIdMatches: checkout.request_id === requestId,
        productIdMatches: checkoutProductId === returnedProductId,
      });
      return NextResponse.json({ error: "payment is not confirmed" }, { status: 409 });
    }

    const product = getProduct(returnedProductId);
    if (!product) {
      return NextResponse.json({ error: "unknown product" }, { status: 409 });
    }

    const pending = await getPendingCheckout("cleanmysocial", requestId);
    const email =
      pending?.email ||
      checkout.metadata?.email ||
      checkout.customer?.email ||
      checkout.customer_email ||
      "";
    if (!isValidEmail(email)) {
      console.error("[creem] confirmed checkout has no license email", { checkoutId });
      return NextResponse.json({ error: "license email is missing" }, { status: 409 });
    }

    await fulfillPaidProduct({
      key: requestId,
      email,
      product,
      creemId: checkout.id,
    });
    return NextResponse.json({ confirmed: true, key: requestId, productId: product.id });
  } catch (error) {
    console.error("[creem] checkout confirmation failed", error);
    return NextResponse.json({ error: "confirmation failed" }, { status: 500 });
  }
}
