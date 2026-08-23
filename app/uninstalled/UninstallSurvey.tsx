"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { LifecycleCopy } from "@/lib/lifecycle-copy";
import { htmlLocale, localeDirection, type Locale } from "@/lib/locales";

type ExtensionSummary = {
  slug: string;
  name: string;
  icon: string;
  storeUrl: string;
};

type RecommendationSummary = {
  slug: string;
  shortName: string;
  icon: string;
  highlight: string;
};

function format(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

export default function UninstallSurvey({
  extension,
  version,
  copy,
  recommendations,
  locale,
}: {
  extension: ExtensionSummary;
  version: string;
  copy: LifecycleCopy;
  recommendations: RecommendationSummary[];
  locale: Locale;
}) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "skipped" | "error">("idle");
  const reasons = [
    ["not_working", copy.reasonNotWorking],
    ["hard_to_use", copy.reasonHard],
    ["missing_feature", copy.reasonMissing],
    ["privacy", copy.reasonPrivacy],
    ["one_time", copy.reasonNoNeed],
    ["other", copy.reasonOther],
  ] as const;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason || state === "sending") return;
    setState("sending");
    try {
      const response = await fetch("/api/uninstall-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extension: extension.slug, version, reason, comment, locale }),
      });
      if (!response.ok) throw new Error("request_failed");
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <div
      className="uninstall-page marketing-page"
      lang={htmlLocale(locale)}
      dir={localeDirection(locale)}
    >
      <header className="uninstall-topbar">
        <Link href="/" className="uninstall-brand">
          <Image src="/icon.svg" alt="" width={28} height={28} priority />
          CleanMySocial
        </Link>
        <span>{copy.anonymousFeedback}</span>
      </header>

      <div className="uninstall-layout">
        <section className="uninstall-intro">
          <Image className="uninstall-product-icon" src={extension.icon} alt="" width={72} height={72} priority />
          <p className="uninstall-kicker">{copy.extensionUninstalled}</p>
          <h1>{copy.thanksTry}</h1>
          <p>
            {format(copy.uninstallQuestion, { name: extension.name })}{" "}
            {copy.oneAnswer}
          </p>
          <a className="uninstall-reinstall" href={extension.storeUrl} target="_blank" rel="noopener noreferrer">
            {format(copy.reinstall, { name: extension.name })}
          </a>
        </section>

        <section
          className={`uninstall-card${state === "sent" || state === "skipped" ? " uninstall-card--complete" : ""}`}
          aria-live="polite"
        >
          {state === "sent" || state === "skipped" ? (
            <div className="uninstall-complete">
              <div className="uninstall-complete-heading">
                <span aria-hidden="true">{state === "sent" ? "✓" : "✦"}</span>
                <div>
                  <p className="uninstall-kicker">{state === "sent" ? copy.feedbackReceived : copy.feedbackSkipped}</p>
                  <h2>{state === "sent" ? copy.thanksHelps : copy.noProblem}</h2>
                  <p>
                    {state === "sent"
                      ? copy.sentAnonymously
                      : copy.nothingSent}
                  </p>
                </div>
              </div>

              <section className="uninstall-family" aria-labelledby="uninstall-family-title">
                <div className="uninstall-family-heading">
                  <p className="uninstall-kicker" id="uninstall-family-title">{copy.more}</p>
                  <Link href="/">{copy.exploreAll}</Link>
                </div>
                <div className="uninstall-family-grid">
                  {recommendations.map((item) => (
                    <Link href={`/${item.slug}`} className="uninstall-family-card" key={item.slug}>
                      <Image src={item.icon} alt="" width={42} height={42} />
                      <div>
                        <strong>
                          {item.shortName}
                          {item.slug === "cleanfeed" ? <small>{copy.free}</small> : null}
                        </strong>
                        <span>{item.highlight}</span>
                      </div>
                      <em aria-hidden="true">→</em>
                    </Link>
                  ))}
                </div>
              </section>

            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="uninstall-card-heading">
                <p className="uninstall-kicker">{copy.whatHappened}</p>
                <h2>{copy.chooseReason}</h2>
              </div>

              <div className="uninstall-reasons">
                {reasons.map(([value, label]) => (
                  <button
                    className={reason === value ? "selected" : ""}
                    key={value}
                    type="button"
                    aria-pressed={reason === value}
                    onClick={() => { setReason(value); setState("idle"); }}
                  >
                    <span aria-hidden="true" /> {label}
                  </button>
                ))}
              </div>

              {reason ? (
                <label className="uninstall-comment">
                  <span>{copy.anythingElse} <small>{copy.optional}</small></span>
                  <textarea
                    value={comment}
                    maxLength={1000}
                    rows={2}
                    placeholder={copy.notePlaceholder}
                    onChange={(event) => setComment(event.target.value)}
                  />
                </label>
              ) : (
                <p className="uninstall-detail-hint">
                  {copy.selectReasonNote}
                </p>
              )}

              <div className="uninstall-actions">
                <button className="uninstall-submit" type="submit" disabled={!reason || state === "sending"}>
                  {state === "sending" ? copy.sending : copy.sendFeedback}
                </button>
                <button className="uninstall-skip" type="button" onClick={() => setState("skipped")}>
                  {copy.skipFeedback}
                </button>
                <small>{copy.anonymousNotice}</small>
              </div>
              {state === "error" ? <p className="uninstall-error">{copy.sendError}</p> : null}
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
