import nodemailer from "nodemailer";
import { SITE } from "./site";
import { EXTENSIONS, FREE_EXTENSIONS } from "./extensions";
import { BUNDLE_PRODUCT } from "./products";
import type { Product } from "./products";

// Transactional mail over SMTP. Defaults target the Namecheap Private Email
// mailbox for info@verblike.com; every value can be overridden by env.
const HOST = process.env.SMTP_HOST || "mail.privateemail.com";
const PORT = Number(process.env.SMTP_PORT || 465);
const USER = process.env.SMTP_USER || SITE.supportEmail;
const PASSWORD = process.env.SMTP_PASSWORD || "";
const FROM = process.env.MAIL_FROM || `${SITE.name} <${USER}>`;

/** False when SMTP_PASSWORD is unset — callers should skip sending, not throw. */
export const mailConfigured = Boolean(PASSWORD);

function transport() {
  return nodemailer.createTransport({
    host: HOST,
    port: PORT,
    // 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: PORT === 465,
    auth: { user: USER, pass: PASSWORD },
  });
}

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export const PRODUCT_NAME = SITE.name;

function productLine(product?: Product): string {
  return product
    ? `${product.name} — ${product.price}, one-time payment with lifetime access`
    : "your selected CleanMySocial product";
}

function extensionsFor(product?: Product) {
  if (!product) return [];
  if (product.kind === "bundle") return EXTENSIONS;
  const entitled = new Set<string>(product.entitlements);
  return EXTENSIONS.filter((extension) => entitled.has(extension.slug));
}

const C = {
  text: "#131720",
  muted: "#5c6472",
  border: "#e4e7ee",
  soft: "#f7f8fb",
  accent: "#2f6bff",
};

function shell(inner: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:${C.soft};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.text};line-height:1.6">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid ${C.border};border-radius:14px;padding:28px">
${inner}
    <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid ${C.border};font-size:13px;color:${C.muted}">
      ${SITE.legalName} · ${SITE.name} · <a href="${SITE.url}" style="color:${C.accent}">${SITE.domain}</a><br>
      You received this email because this address was entered at checkout on ${SITE.domain}.
    </p>
  </div>
</body></html>`;
}

/** "Check our other popular tools" — the two free extensions. */
function crossPromoHtml(): string {
  const items = FREE_EXTENSIONS.map(
    (ext) =>
      `<li style="margin-bottom:10px"><a href="${ext.storeUrl}" style="color:${C.accent};font-weight:600">${ext.name}</a> <span style="color:${C.muted}">— ${ext.tagline} Free.</span></li>`,
  ).join("\n      ");
  return `    <h2 style="margin:28px 0 10px;font-size:17px">Check our other popular tools</h2>
    <p style="margin:0 0 10px;color:${C.muted}">Both are completely free — no account, no quota, no license key:</p>
    <ul style="margin:0;padding-left:20px">
      ${items}
    </ul>
    <p style="margin:12px 0 0"><a href="${SITE.url}/#extensions" style="color:${C.accent}">See everything we make →</a></p>`;
}

function crossPromoText(): string {
  return [
    "Check our other popular tools — both completely free:",
    "",
    ...FREE_EXTENSIONS.flatMap((ext) => [`  ${ext.name}`, `  ${ext.storeUrl}`, ""]),
    `See everything we make: ${SITE.url}/#extensions`,
  ].join("\n");
}

/** The refund promise, after a caller-supplied lead-in sentence. */
const refundHtml = (lead: string) =>
  `${lead} We refund in full within 14 days, no questions asked — just email <a href="mailto:${SITE.supportEmail}" style="color:${C.accent}">${SITE.supportEmail}</a> with your license key. Our goal is for every customer to be 100% satisfied.`;
const refundText = (lead: string) =>
  `${lead} We refund in full within 14 days, no questions asked — just email ${SITE.supportEmail} with your license key. Our goal is for every customer to be 100% satisfied.`;

/* ------------------------------ license email ----------------------------- */

function licenseHtml(key: string, product?: Product): string {
  const includedExtensions = extensionsFor(product);
  const included = includedExtensions.map(
    (ext) =>
      `<li style="margin-bottom:8px"><a href="${ext.storeUrl}" style="color:${C.accent};font-weight:600">${ext.name}</a> <span style="color:${C.muted}">— ${ext.tagline}</span></li>`,
  ).join("\n      ");
  const includedCopy = product?.kind === "bundle"
    ? "Your purchase includes every CleanMySocial tool:"
    : `Your license unlocks the following paid tool${includedExtensions.length === 1 ? "" : "s"}:`;
  const freeRecommendations = product?.kind === "bundle" ? "" : crossPromoHtml();
  return shell(`    <h1 style="margin:0 0 16px;font-size:22px">Thank you for your ${PRODUCT_NAME} purchase!</h1>
    <p style="margin:0 0 8px"><strong>What you bought:</strong> ${productLine(product)}</p>
    <p style="margin:0 0 10px">${includedCopy}</p>
    <ul style="margin:0 0 18px;padding-left:20px">
      ${included}
    </ul>
    <p style="margin:0 0 12px"><strong>Your license key</strong> — keep this email so you can restore access on any browser or computer:</p>
    <p style="margin:0 0 20px;padding:14px;background:${C.soft};border:1px solid ${C.border};border-radius:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px;word-break:break-all">${key}</p>
    <p style="margin:0 0 16px">If you bought from inside an extension, it has already unlocked itself — nothing to do. To unlock a different browser, paste the key above into the extension's license box.</p>
    <p style="margin:0 0 16px;color:${C.muted}">${refundHtml("Not happy for any reason?")}</p>
${freeRecommendations}`);
}

function licenseText(key: string, product?: Product): string {
  const includedExtensions = extensionsFor(product);
  const freeRecommendations = product?.kind === "bundle" ? [] : ["", crossPromoText()];
  return [
    `Thank you for your ${PRODUCT_NAME} purchase!`,
    "",
    `What you bought: ${productLine(product)}`,
    "",
    product?.kind === "bundle"
      ? "Your purchase includes every CleanMySocial tool:"
      : "Your license unlocks:",
    ...includedExtensions.flatMap((ext) => [`  - ${ext.name}`, `    ${ext.storeUrl}`]),
    "",
    "Your license key — keep this email so you can restore access on any",
    "browser or computer:",
    "",
    `  ${key}`,
    "",
    "If you bought from inside an extension, it has already unlocked itself.",
    "To unlock a different browser, paste the key above into the extension's",
    "license box.",
    "",
    refundText("Not happy for any reason?"),
    ...freeRecommendations,
    "",
    `${SITE.legalName} · ${SITE.name} · ${SITE.url}`,
  ].join("\n");
}

/* --------------------------- abandoned checkout --------------------------- */

function abandonedHtml(product?: Product): string {
  return shell(`    <h1 style="margin:0 0 16px;font-size:22px">You didn&rsquo;t finish your ${SITE.name} purchase</h1>
    <p style="margin:0 0 16px">You started checkout for <strong>${productLine(product)}</strong>, but the payment never went through — so you don&rsquo;t have your license key yet.</p>
    <p style="margin:0 0 16px">If it was a card problem or the page got in your way, you can pick up where you left off:</p>
    <p style="margin:0 0 20px"><a href="${SITE.url}/pricing" style="display:inline-block;padding:12px 20px;background:${C.accent};color:#fff;border-radius:10px;font-weight:600;text-decoration:none">Finish your purchase</a></p>
    <p style="margin:0 0 16px">And if something put you off, we&rsquo;d genuinely like to know — just hit reply and tell us. We read every answer, and it&rsquo;s the main way we decide what to fix next.</p>
    <p style="margin:0 0 16px;color:${C.muted}">${refundHtml("Hesitating? There is no risk on your side.")}</p>
${crossPromoHtml()}`);
}

function abandonedText(product?: Product): string {
  return [
    `You didn't finish your ${SITE.name} purchase`,
    "",
    `You started checkout for ${productLine(product)}, but the payment never went`,
    "through — so you don't have your license key yet.",
    "",
    "You can pick up where you left off here:",
    `  ${SITE.url}/pricing`,
    "",
    "And if something put you off, we'd genuinely like to know — just hit",
    "reply and tell us. We read every answer, and it's the main way we decide",
    "what to fix next.",
    "",
    refundText("Hesitating? There is no risk on your side."),
    "",
    crossPromoText(),
    "",
    `${SITE.legalName} · ${SITE.name} · ${SITE.url}`,
  ].join("\n");
}

/* -------------------------------- sending --------------------------------- */

async function send(to: string, subject: string, text: string, html: string) {
  if (!mailConfigured || !isValidEmail(to)) return false;
  try {
    await transport().sendMail({
      from: FROM,
      to: to.trim(),
      replyTo: SITE.supportEmail,
      subject,
      text,
      html,
    });
    return true;
  } catch (e) {
    console.error("[mail] send failed", subject, e);
    return false;
  }
}

/**
 * Deliver the license key. Returns false (without throwing) when SMTP is not
 * configured or delivery fails — the purchase itself must never depend on mail.
 */
export function sendLicenseEmail(
  to: string,
  key: string,
  product: Product = BUNDLE_PRODUCT,
): Promise<boolean> {
  return send(
    to,
    `Your ${product.name} license key`,
    licenseText(key, product),
    licenseHtml(key, product),
  );
}

/** One-time nudge for a checkout started but not paid ~24h ago. */
export function sendAbandonedCheckoutEmail(
  to: string,
  product?: Product,
): Promise<boolean> {
  return send(
    to,
    `Did something go wrong with your ${SITE.name} order?`,
    abandonedText(product),
    abandonedHtml(product),
  );
}
