import { kvGet, kvSet } from "./store";
import type { Access } from "./extensions";

export interface License {
  /** license key = the extension's install token (also shown on the success page) */
  key: string;
  extension: string;
  plan: string;
  access: Access;
  /** epoch ms when access ends; null = never (lifetime) */
  expiresAt: number | null;
  updatedAt: number;
  creemId?: string;
}

/** Normalize a key so lookups match regardless of casing/whitespace. */
export function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

function storeKey(extension: string, key: string) {
  return `license:${extension}:${normalizeKey(key)}`;
}

/** How long access lasts from "now" for a given access tier. */
function ttlMsFor(access: Access): number | null {
  return access === "lifetime" ? null : null;
}

export async function grantLicense(input: {
  key: string;
  extension: string;
  plan: string;
  access: Access;
  creemId?: string;
}): Promise<License> {
  const ttlMs = ttlMsFor(input.access);
  const license: License = {
    key: normalizeKey(input.key),
    extension: input.extension,
    plan: input.plan,
    access: input.access,
    expiresAt: ttlMs === null ? null : Date.now() + ttlMs,
    updatedAt: Date.now(),
    creemId: input.creemId,
  };
  // Store with a matching Redis TTL so time-boxed records self-clean
  // (add slack so a re-check just after expiry still reads the record).
  const ttlSeconds = ttlMs === null ? undefined : Math.ceil(ttlMs / 1000);
  await kvSet(storeKey(input.extension, input.key), JSON.stringify(license), ttlSeconds);
  return license;
}

export async function revokeLicense(
  extension: string,
  key: string
): Promise<void> {
  const existing = await getLicense(extension, key);
  if (!existing) return;
  const revoked: License = { ...existing, expiresAt: Date.now(), updatedAt: Date.now() };
  await kvSet(storeKey(extension, key), JSON.stringify(revoked), 7 * 24 * 60 * 60);
}

export async function getLicense(
  extension: string,
  key: string
): Promise<License | null> {
  const raw = await kvGet(storeKey(extension, key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as License;
  } catch {
    return null;
  }
}

export function isActive(license: License | null): boolean {
  if (!license) return false;
  if (license.expiresAt === null) return true;
  return license.expiresAt > Date.now();
}
