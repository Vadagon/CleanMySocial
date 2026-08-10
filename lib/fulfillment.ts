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
  subscriptionId?: string;
  subscriptionStatus?: "active" | "trialing";
  currentPeriodEnd?: number;
  paidAt?: number;
}): Promise<void> {
  const { key, email, product, creemId } = input;

  await grantLicense({
    key,
    extension: LICENSE_GROUP,
    plan: product.billingPeriod === "every-month" ? "monthly" : "lifetime",
    access: product.access,
    creemId,
    email,
    entitlements: product.entitlements,
    productId: product.id,
    productName: product.name,
    billingType: product.billingType,
    billingPeriod: product.billingPeriod,
    subscriptionId: input.subscriptionId,
    subscriptionStatus: input.subscriptionStatus,
    currentPeriodEnd: input.currentPeriodEnd,
    paidAt: input.paidAt,
  });
  const auditId = creemId || `${product.id}:${Date.now()}`;
  await kvSet(
    `purchase:creem:${auditId}`,
    JSON.stringify({
      licenseGroup: LICENSE_GROUP,
      licenseKey: key.trim().toLowerCase(),
      extensionSlugs: product.entitlements,
      productId: product.id,
      productName: product.name,
      billingType: product.billingType,
      billingPeriod: product.billingPeriod,
      accessGranted: product.access,
      subscriptionId: input.subscriptionId || null,
      subscriptionStatus: input.subscriptionStatus || null,
      currentPeriodEnd: input.currentPeriodEnd || null,
      email,
      updatedAt: Date.now(),
    }),
  );
  if (input.subscriptionId) {
    // Subscription lifecycle payloads do not always repeat checkout metadata.
    // This durable reverse lookup keeps renewals/cancellations attributable to
    // the exact license and product that created the Creem subscription.
    await kvSet(
      `subscription:creem:${input.subscriptionId}`,
      JSON.stringify({
        subscriptionId: input.subscriptionId,
        licenseGroup: LICENSE_GROUP,
        licenseKey: key.trim().toLowerCase(),
        productId: product.id,
        productName: product.name,
        extensionSlugs: product.entitlements,
        email,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
  }
  await clearPendingCheckout(LICENSE_GROUP, key);

  const normalizedKey = key.trim().toLowerCase();
  const marker = `mailed:${LICENSE_GROUP}:${normalizedKey}:${product.id}`;
  const claim = `mailing:${LICENSE_GROUP}:${normalizedKey}:${product.id}`;
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
