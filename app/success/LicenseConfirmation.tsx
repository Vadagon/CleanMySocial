"use client";

import { useEffect, useState } from "react";

type State = "confirming" | "confirmed" | "waiting";

export default function LicenseConfirmation({ enabled }: { enabled: boolean }) {
  const [state, setState] = useState<State>(enabled ? "confirming" : "waiting");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function confirm() {
      try {
        const response = await fetch(`/api/creem/confirm${window.location.search}`, {
          cache: "no-store",
        });
        if (!cancelled) setState(response.ok ? "confirmed" : "waiting");
      } catch {
        if (!cancelled) setState("waiting");
      }
    }

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return (
    <p className={`confirmation-status confirmation-${state}`} role="status">
      {state === "confirmed"
        ? "Your license is active and its key has been emailed to you."
        : state === "confirming"
          ? "Confirming and activating your license…"
          : "Creem is still confirming your order. Keep this page open or check your email in a few minutes."}
    </p>
  );
}

