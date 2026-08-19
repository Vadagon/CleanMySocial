"use client";

import { useState } from "react";

/**
 * The key shown here is the buyer's only automatic route into the extension —
 * nothing is handed back to it silently — so this card has to make copying it
 * effortless and say exactly where it goes.
 */
export default function LicenseKeyCard({ licenseKey }: { licenseKey: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the key is selectable on the page regardless.
    }
  }

  return (
    <div className="notice license-card">
      <p>
        <strong>Your license key</strong> — keep a copy. You&rsquo;ll need it to
        unlock the extension on every browser and computer you use.
      </p>
      <div className="license-key-row">
        <code className="license-key">{licenseKey}</code>
        <button type="button" className="btn secondary license-copy" onClick={copy}>
          {copied ? "Copied" : "Copy key"}
        </button>
      </div>
      <ol className="license-steps">
        <li>Open the extension&rsquo;s side panel.</li>
        <li>
          Click <strong>GET UNLIMITED</strong> (or the <strong>FREE</strong> badge)
          to open the unlock dialog.
        </li>
        <li>Paste the key above and press unlock.</li>
      </ol>
      <p className="small muted">
        We&rsquo;ve also emailed this key to the address you used at checkout.
      </p>
    </div>
  );
}
