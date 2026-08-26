"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import type { Locale } from "@/lib/locales";
import { purchaseCopy } from "@/lib/purchase-copy";

export default function ProductInstallAction({
  extension,
  storeUrl,
  locale = "en",
}: {
  extension: string;
  storeUrl: string;
  locale?: Locale;
}) {
  const copy = purchaseCopy(locale);
  const [fromExtension, setFromExtension] = useState(false);

  // `lk` only tells us the visitor arrived from an installed extension, so we
  // can skip the "install it first" call to action. It is never used as a
  // license key — the checkout panel mints its own.
  useEffect(() => {
    setFromExtension(Boolean(new URLSearchParams(window.location.search).get("lk")));
  }, []);

  if (fromExtension) {
    return (
      <a className="extension-detected" href="#access-options">
        <span aria-hidden="true">✓</span>
        {copy.extensionDetected}
      </a>
    );
  }

  return (
    <a
      className="btn extension-install-button"
      href={storeUrl}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackStoreClick(extension)}
    >
      <Image
        className="extension-install-button-icon"
        src="/chrome-logo.png"
        alt=""
        width={20}
        height={20}
        aria-hidden="true"
      />
      {copy.viewStore}
    </a>
  );
}

function trackStoreClick(extension: string) {
  track("select_item", {
    item_list_id: "chrome_web_store",
    placement: extension,
    destination: "chrome_web_store",
  });
}
