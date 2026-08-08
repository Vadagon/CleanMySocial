import crypto from "crypto";

/** Verify Creem's checkout return signature using the parameters' URL order. */
export function verifyCreemRedirect(
  entries: Iterable<[string, string]>,
  apiKey: string,
): boolean {
  if (!apiKey) return false;

  const parts: string[] = [];
  let supplied = "";
  for (const [key, value] of entries) {
    if (key === "signature") {
      supplied = value;
      continue;
    }
    if (!value || value === "null") continue;
    parts.push(`${key}=${value}`);
  }
  if (!supplied || !/^[a-f\d]{64}$/i.test(supplied)) return false;

  parts.push(`salt=${apiKey}`);
  const expected = crypto
    .createHash("sha256")
    .update(parts.join("|"))
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(supplied.toLowerCase(), "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}

