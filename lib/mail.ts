import nodemailer from "nodemailer";
import { SITE } from "./site";
import { EXTENSIONS } from "./extensions";
import { BUNDLE_PRODUCT } from "./products";
import type { Product } from "./products";

// Transactional mail over SMTP. Defaults target the Namecheap Private Email
// mailbox for info@verblike.com; every value can be overridden by env.
const HOST = process.env.SMTP_HOST || "mail.privateemail.com";
const PORT = Number(process.env.SMTP_PORT || 465);
const USER = process.env.SMTP_USER || SITE.supportEmail;
const PASSWORD = process.env.SMTP_PASSWORD || "";
const FROM = process.env.MAIL_FROM || `${SITE.name} <${USER}>`;
const TRUSTPILOT_PURCHASE_BCC =
  "www.cleanmysocial.com+912a4e709e@invite.trustpilot.com";

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
    ? `${product.name} — ${product.price}, ${
        product.billingType === "recurring"
          ? "monthly subscription"
          : "one-time payment with lifetime access"
      }`
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

/** The refund promise, after a caller-supplied lead-in sentence. */
const refundHtml = (lead: string) =>
  `${lead} If it’s not right for you, email <a href="mailto:${SITE.supportEmail}" style="color:${C.accent}">${SITE.supportEmail}</a> with your license key within 14 days. Our goal is for every customer to be 100% satisfied.`;
const refundText = (lead: string) =>
  `${lead} If it’s not right for you, email ${SITE.supportEmail} with your license key within 14 days. Our goal is for every customer to be 100% satisfied.`;

/* ------------------------------ license email ----------------------------- */

function licenseHtml(key: string, product?: Product): string {
  const includedExtensions = extensionsFor(product);
  const included = includedExtensions.map(
    (ext) =>
      `<a href="${ext.storeUrl}" style="display:flex;align-items:center;gap:11px;margin:0 0 10px;color:${C.text};font-weight:650;text-decoration:none">
        <img src="${SITE.url}${ext.icon}" width="36" height="36" alt="" style="display:block;width:36px;height:36px;border-radius:9px">
        <span>${ext.name}</span>
      </a>`,
  ).join("\n      ");
  return shell(`    <h1 style="margin:0 0 16px;font-size:22px">Your ${PRODUCT_NAME} license</h1>
    <p style="margin:0 0 16px"><strong>${product?.name || PRODUCT_NAME}</strong></p>
    <div style="margin:0 0 20px">
      ${included}
    </div>
    <p style="margin:0 0 8px"><strong>Your license key</strong></p>
    <p style="margin:0 0 20px;padding:14px;background:${C.soft};border:1px solid ${C.border};border-radius:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px;word-break:break-all">${key}</p>
    <p style="margin:0 0 16px">Your extension should unlock automatically. Keep this email to restore access on another browser.</p>
    <p style="margin:0;color:${C.muted}">If something doesn&rsquo;t work, message us at <a href="mailto:${SITE.supportEmail}" style="color:${C.accent}">${SITE.supportEmail}</a> and we&rsquo;ll help you.</p>`);
}

function licenseText(key: string, product?: Product): string {
  const includedExtensions = extensionsFor(product);
  return [
    `Your ${PRODUCT_NAME} license`,
    "",
    product?.name || PRODUCT_NAME,
    "",
    ...includedExtensions.map((ext) => `- ${ext.name}`),
    "",
    "Your license key:",
    key,
    "",
    "Your extension should unlock automatically. Keep this email to restore",
    "access on another browser.",
    "",
    `If something doesn't work, message us at ${SITE.supportEmail} and we'll help you.`,
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
    <p style="margin:0 0 16px;color:${C.muted}">${refundHtml("Hesitating? There is no risk on your side.")}</p>`);
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
    `${SITE.legalName} · ${SITE.name} · ${SITE.url}`,
  ].join("\n");
}

/* ---------------------------- breakage reports ---------------------------- */

/** Where extension breakage reports go. Not a customer-facing address. */
const REPORT_TO = process.env.REPORT_EMAIL || "verbalike@gmail.com";

export interface BreakageReport {
  extension: string;
  version: string;
  code: string;
  locale: string;
  browser: string;
}

function reportRows(report: BreakageReport): [string, string][] {
  return [
    ["Extension", report.extension],
    ["Version", report.version],
    ["Failure", report.code],
    ["UI language", report.locale],
    ["Browser", report.browser],
    ["Reported at", new Date().toISOString()],
  ];
}

function breakageHtml(report: BreakageReport): string {
  const rows = reportRows(report)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:${C.muted};white-space:nowrap">${label}</td><td style="padding:6px 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${escapeHtml(value)}</td></tr>`,
    )
    .join("\n      ");
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:${C.soft};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.text};line-height:1.6">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid ${C.border};border-radius:14px;padding:28px">
    <h1 style="margin:0 0 6px;font-size:20px">An extension reported a failure</h1>
    <p style="margin:0 0 18px;color:${C.muted}">A user pressed the report button after the extension could not talk to the platform. No user or friend data is included.</p>
    <table style="border-collapse:collapse;font-size:14px">
      ${rows}
    </table>
    <p style="margin:22px 0 0;color:${C.muted};font-size:13px">Reports for the same extension and failure are sent at most once an hour.</p>
  </div>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

function breakageText(report: BreakageReport): string {
  return [
    "An extension reported a failure.",
    "",
    ...reportRows(report).map(([label, value]) => `${label}: ${value}`),
    "",
    "No user or friend data is included. Reports for the same extension and",
    "failure are sent at most once an hour.",
  ].join("\n");
}

/**
 * Tell the developer an extension stopped working. Sent to the developer
 * address, never to a customer, and it must never throw into the request path.
 */
export function sendBreakageReport(report: BreakageReport): Promise<boolean> {
  return send(
    REPORT_TO,
    `[${report.extension}] ${report.code} — extension failure reported`,
    breakageText(report),
    breakageHtml(report),
  );
}

export interface CrashAlert {
  kind: "new_issue" | "spike";
  extension: string;
  extensionName: string;
  version: string;
  fingerprint: string;
  name: string;
  code: string | null;
  message: string;
  source: string;
  affectedInstallations: number;
  windowMinutes?: number;
}

function crashAlertTitle(alert: CrashAlert): string {
  return alert.kind === "spike"
    ? `Crash spike: ${alert.affectedInstallations} installations affected`
    : `New crash in ${alert.extensionName} ${alert.version}`;
}

function crashAlertText(alert: CrashAlert): string {
  return [
    crashAlertTitle(alert),
    "",
    `Extension: ${alert.extension} (${alert.extensionName})`,
    `Version: ${alert.version}`,
    `Issue: ${alert.name}${alert.code ? ` · ${alert.code}` : ""}`,
    `Message: ${alert.message}`,
    `Source: ${alert.source}`,
    `Fingerprint: ${alert.fingerprint}`,
    alert.kind === "spike"
      ? `Affected installations: ${alert.affectedInstallations} in ${alert.windowMinutes || 15} minutes`
      : "This fingerprint is new for this extension version.",
    "",
    `Dashboard: ${SITE.url}/crash`,
  ].join("\n");
}

function crashAlertHtml(alert: CrashAlert): string {
  const rows: [string, string][] = [
    ["Extension", `${alert.extensionName} (${alert.extension})`],
    ["Version", alert.version],
    ["Issue", `${alert.name}${alert.code ? ` · ${alert.code}` : ""}`],
    ["Message", alert.message],
    ["Source", alert.source],
    ["Fingerprint", alert.fingerprint],
    [
      "Scope",
      alert.kind === "spike"
        ? `${alert.affectedInstallations} installations in ${alert.windowMinutes || 15} minutes`
        : "First report for this fingerprint and version",
    ],
  ];
  const table = rows.map(([label, value]) =>
    `<tr><td style="padding:6px 12px 6px 0;color:${C.muted};white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${escapeHtml(value)}</td></tr>`,
  ).join("\n");
  return `<!doctype html><html><body style="margin:0;padding:24px;background:${C.soft};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.text};line-height:1.6">
  <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid ${C.border};border-radius:14px;padding:28px">
    <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(crashAlertTitle(alert))}</h1>
    <table style="border-collapse:collapse;font-size:14px">${table}</table>
    <p style="margin:22px 0 0"><a href="${SITE.url}/crash" style="display:inline-block;padding:10px 16px;background:${C.accent};color:#fff;border-radius:8px;font-weight:600;text-decoration:none">Open crash dashboard</a></p>
  </div></body></html>`;
}

/** Developer-only reliability alert; false when SMTP is unavailable. */
export function sendCrashAlert(alert: CrashAlert): Promise<boolean> {
  return send(
    REPORT_TO,
    `[${alert.extension}] ${crashAlertTitle(alert)}`,
    crashAlertText(alert),
    crashAlertHtml(alert),
  );
}

/* -------------------------------- sending --------------------------------- */

/** Did the SMTP server actually accept the address we care about? */
function wasAccepted(
  info: { accepted?: (string | { address?: string })[]; rejected?: (string | { address?: string })[] },
  recipient: string,
): boolean {
  const addressOf = (entry: string | { address?: string }) =>
    (typeof entry === "string" ? entry : entry?.address || "").trim().toLowerCase();
  const target = recipient.trim().toLowerCase();
  const rejected = (info.rejected || []).map(addressOf);
  if (rejected.includes(target)) return false;
  const accepted = (info.accepted || []).map(addressOf);
  // Some servers report neither list. Absence of an explicit rejection is the
  // best signal available, so only fail closed when we were told "no".
  if (!accepted.length && !rejected.length) return true;
  return accepted.includes(target);
}

/**
 * Send one message and report honestly whether *this* recipient took it.
 *
 * nodemailer resolves as long as a single recipient is accepted, so a message
 * with extra recipients could previously "succeed" while the customer's own
 * address bounced at RCPT TO. Anything that gates retries on the return value
 * needs the per-recipient answer, not the envelope's.
 */
async function send(
  to: string,
  subject: string,
  text: string,
  html: string,
) {
  if (!mailConfigured || !isValidEmail(to)) return false;
  try {
    const info = (await transport().sendMail({
      from: FROM,
      to: to.trim(),
      replyTo: SITE.supportEmail,
      subject,
      text,
      html,
    })) as { accepted?: string[]; rejected?: string[] };
    if (!wasAccepted(info, to)) {
      console.error("[mail] recipient rejected", subject, {
        accepted: info.accepted,
        rejected: info.rejected,
      });
      return false;
    }
    return true;
  } catch (e) {
    console.error("[mail] send failed", subject, e);
    return false;
  }
}

/**
 * Deliver the license key. Returns false (without throwing) when SMTP is not
 * configured or delivery fails — the purchase itself must never depend on mail.
 *
 * The Trustpilot review invite is sent as its own message rather than as a BCC
 * on this one. Sharing an envelope meant a Trustpilot acceptance could mask a
 * rejection of the customer's address, and a Trustpilot failure could sink a
 * license key that had nothing wrong with it.
 */
export async function sendLicenseEmail(
  to: string,
  key: string,
  product: Product = BUNDLE_PRODUCT,
): Promise<boolean> {
  const delivered = await send(
    to,
    `Your ${product.name} license key`,
    licenseText(key, product),
    licenseHtml(key, product),
  );
  if (delivered) void sendTrustpilotInvite(to, product);
  return delivered;
}

/**
 * Review invite, deliberately fire-and-forget: it must never influence whether
 * a paid customer is considered to have their key.
 */
async function sendTrustpilotInvite(to: string, product: Product): Promise<void> {
  if (!mailConfigured || !isValidEmail(to)) return;
  try {
    await transport().sendMail({
      from: FROM,
      to: TRUSTPILOT_PURCHASE_BCC,
      replyTo: SITE.supportEmail,
      subject: `Your ${product.name} license key`,
      text: `Purchase confirmation copy for review invitations. Customer: ${to.trim()}`,
    });
  } catch (e) {
    console.error("[mail] trustpilot invite failed", e);
  }
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
