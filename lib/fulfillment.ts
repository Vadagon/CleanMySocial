import { grantLicense } from "./license";
import { sendLicenseEmail } from "./mail";
import type { Product } from "./products";
import { clearPendingCheckout } from "./pending";
import { kvDel, kvGet, kvSet, kvSetNx } from "./store";

const LICENSE_GROUP = "cleanmysocial";

/**
 * Grant a paid product and deliver its key exactly once. This is shared by the
 * webhook and the verified checkout-return fallback so either path can finish
 * an order without creating duplicate mail.
 */
export async function fulfillPaidProduct(input: {
  key: string;
  email: string;
  product: Product;
  creemId?: string;
}): Promise<void> {
  const { key, email, product, creemId } = input;

  await grantLicense({
    key,
    extension: LICENSE_GROUP,
    plan: product.kind,
    access: "lifetime",
    creemId,
    email,
    entitlements: product.entitlements,
    productId: product.id,
  });
  await clearPendingCheckout(LICENSE_GROUP, key);

  const normalizedKey = key.trim().toLowerCase();
  const marker = `mailed:${LICENSE_GROUP}:${normalizedKey}`;
  const claim = `mailing:${LICENSE_GROUP}:${normalizedKey}`;
  if (await kvGet(marker)) return;

  // Webhook and return-page confirmation can race. One sends; the other gets
  // a retryable failure. The short lock recovers automatically after a crash.
  if (!(await kvSetNx(claim, String(Date.now()), 5 * 60))) {
    throw new Error("license email is already being sent");
  }
  try {
    const sent = await sendLicenseEmail(email, key, product);
    if (!sent) throw new Error("license email was not accepted by SMTP");
    await kvSet(marker, String(Date.now()));
  } finally {
    await kvDel(claim);
  }
}

