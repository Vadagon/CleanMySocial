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

type LaunchMode = "checking" | "activate" | "external";

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
  const [mode, setMode] = useState<LaunchMode>("checking");
  const [activating, setActivating] = useState(false);
  const copy = activationCopy(locale);

  useEffect(() => {
    let current = true;
    const minimumLoadingTime = new Promise((resolve) => window.setTimeout(resolve, 650));
    void Promise.all([send(extensionId, "capabilities"), minimumLoadingTime]).then(([response]) => {
      if (!current) return;
      setMode(
        response?.protocol === PROTOCOL &&
        response.ok === true &&
        response.capabilities?.includes(CAPABILITY) === true
          ? "activate"
          : "external",
      );
    });
    return () => { current = false; };
  }, [extensionId]);

  if (mode === "checking") {
    return (
      <span className="installed-launch installed-launch--checking" aria-hidden="true">
        <span className="installed-launch-placeholder" />
        <span className="installed-launch-icon">
          <i className="installed-launch-spinner" />
        </span>
      </span>
    );
  }

  if (mode === "external") {
    return (
      <a className="installed-launch installed-launch--ready" href={installedUrl} target="_blank" rel="noopener noreferrer">
        <span className="installed-launch-label">{fallbackLabel}</span>
        <span className="installed-launch-icon" aria-hidden="true">↗</span>
      </a>
    );
  }

  return (
    <button
      className="installed-launch installed-launch--ready"
      type="button"
      disabled={activating}
      aria-busy={activating}
      onClick={async () => {
        setActivating(true);
        const response = await send(extensionId, "activate");
        if (response?.protocol !== PROTOCOL || response.ok !== true) setMode("external");
        setActivating(false);
      }}
    >
      <span className="installed-launch-label">{activating ? copy.activating : copy.activate}</span>
      <span className="installed-launch-icon" aria-hidden="true">→</span>
    </button>
  );
}
