"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

export default function ProductInstallAction({
  extension,
  storeUrl,
}: {
  extension: string;
  storeUrl: string;
}) {
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
        Extension detected · Already installed
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
      View on Web Store
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
