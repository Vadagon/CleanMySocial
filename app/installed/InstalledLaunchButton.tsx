"use client";

import { useEffect, useState } from "react";
import { activationCopy } from "@/lib/activation-copy";
import type { Locale } from "@/lib/locales";

const PROTOCOL = "cleanmysocial-installed-v1";
const CAPABILITY = "open-side-panel";
const TIMEOUT_MS = 2500;
const REQUEST_EVENT = "cleanmysocial:installed-request";
const RESPONSE_EVENT = "cleanmysocial:installed-response";

type ExternalResponse = {
  protocol?: string;
  ok?: boolean;
  capabilities?: string[];
};

function requestId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function send(extensionId: string, type: string): Promise<ExternalResponse | null> {
  return new Promise((resolve) => {
    const id = requestId();
    let finished = false;
    const finish = (response: ExternalResponse | null) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      window.removeEventListener(RESPONSE_EVENT, onResponse);
      resolve(response);
    };
    const onResponse = (event: Event) => {
      try {
        const response = JSON.parse((event as CustomEvent<string>).detail) as ExternalResponse & {
          requestId?: string;
          extensionId?: string;
        };
        if (response.requestId !== id || response.extensionId !== extensionId) return;
        finish(response);
      } catch {
        // Ignore malformed or unrelated page events.
      }
    };
    const timeout = window.setTimeout(() => finish(null), TIMEOUT_MS);
    window.addEventListener(RESPONSE_EVENT, onResponse);
    window.dispatchEvent(new CustomEvent(REQUEST_EVENT, {
      detail: JSON.stringify({ protocol: PROTOCOL, requestId: id, extensionId, type }),
    }));
  });
}

export default function InstalledLaunchButton({
  extensionId,
  installedUrl,
  fallbackLabel,
  locale,
}: {
  extensionId: string;
  installedUrl: string;
  fallbackLabel: string;
  locale: Locale;
}) {
  const [canActivate, setCanActivate] = useState(false);
  const [activating, setActivating] = useState(false);
  const copy = activationCopy(locale);

  useEffect(() => {
    let current = true;
    void send(extensionId, "capabilities").then((response) => {
      if (!current) return;
      setCanActivate(
        response?.protocol === PROTOCOL &&
        response.ok === true &&
        response.capabilities?.includes(CAPABILITY) === true,
      );
    });
    return () => { current = false; };
  }, [extensionId]);

  if (!canActivate) {
    return (
      <a className="installed-launch" href={installedUrl} target="_blank" rel="noopener noreferrer">
        {fallbackLabel} <span aria-hidden="true">↗</span>
      </a>
    );
  }

  return (
    <button
      className="installed-launch"
      type="button"
      disabled={activating}
      onClick={async () => {
        setActivating(true);
        const response = await send(extensionId, "activate");
        if (response?.protocol !== PROTOCOL || response.ok !== true) setCanActivate(false);
        setActivating(false);
      }}
    >
      {activating ? copy.activating : copy.activate}
    </button>
  );
}
