"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { LifecycleCopy } from "@/lib/lifecycle-copy";
import { htmlLocale, localeDirection, type Locale } from "@/lib/locales";
import { discountCopy } from "@/lib/discount-copy";

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

const PRICE_REASON: Record<Locale, string> = {
  en: "It was too expensive",
  de: "Es war zu teuer",
  ja: "料金が高すぎた",
  fr: "C’était trop cher",
  ko: "가격이 너무 비쌌어요",
  nl: "Het was te duur",
  it: "Costava troppo",
  es: "Era demasiado cara",
  pl: "Cena była zbyt wysoka",
  zh_TW: "價格太高",
  zh_CN: "价格太高",
  sv: "Det var för dyrt",
  da: "Den var for dyr",
  no: "Den var for dyr",
  fi: "Se oli liian kallis",
  he: "המחיר היה גבוה מדי",
  cs: "Bylo příliš drahé",
  pt_PT: "Era demasiado caro",
  pt_BR: "Era caro demais",
  es_419: "Era demasiado cara",
  ar: "كان السعر مرتفعًا جدًا",
  ro: "Era prea scumpă",
  hu: "Túl drága volt",
  tr: "Çok pahalıydı",
  th: "ราคาแพงเกินไป",
  id: "Harganya terlalu mahal",
  vi: "Giá quá cao",
};

const ENGLISH_FOLLOW_UPS: Record<string, string> = {
  not_working: "What happened?",
  price: "What price would feel reasonable?",
  hard_to_use: "What was confusing?",
  missing_feature: "What did you need?",
  privacy: "What concerned you?",
  one_time: "Was this only a one-time cleanup?",
  other: "What made you uninstall it?",
};

const ENGLISH_RECOVERY_MESSAGES: Record<string, string> = {
  hard_to_use: "We can help you get started.",
  missing_feature: "Tell us what you needed.",
  privacy: "See exactly what stays private.",
  one_time: "Finished here? Try another cleanup tool.",
  other: "Tell us what happened.",
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
    ["not_working", copy.reasonNotWorking, "×", "blue"],
    ["hard_to_use", copy.reasonHard, "?", "amber"],
    ["price", PRICE_REASON[locale], "$", "green"],
    ["missing_feature", copy.reasonMissing, "+", "violet"],
    ["privacy", copy.reasonPrivacy, "◇", "orange"],
    ["one_time", locale === "en" ? "I finished what I needed" : copy.reasonNoNeed, "✓", "mint"],
  ] as const;
  const followUp = locale === "en"
    ? ENGLISH_FOLLOW_UPS[reason]
    : copy.anythingElse;
  const offerCopy = discountCopy(locale);
  const retentionMessage = reason === "price"
    ? offerCopy.recovery
    : locale === "en"
      ? ENGLISH_RECOVERY_MESSAGES[reason]
      : copy.notePlaceholder;
  const questionParts = copy.uninstallQuestion.split("{name}");
  const recovery = reason === "hard_to_use"
    ? { href: "/support", label: copy.support }
    : reason === "price"
      ? { href: `/${extension.slug}?discount=on&lang=${locale}#access-options`, label: offerCopy.claim }
      : reason === "privacy"
        ? { href: `/privacy/${extension.slug}`, label: copy.seeAccess }
        : reason === "one_time"
          ? { href: "/", label: copy.exploreAll }
          : null;

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
      </header>

      <div className="uninstall-layout">
        <section className="uninstall-intro">
          <div className="uninstall-artwork" aria-hidden="true">
            <Image className="uninstall-product-icon" src={extension.icon} alt="" width={112} height={112} priority />
          </div>
          <p className="uninstall-kicker">{copy.extensionUninstalled}</p>
          <h1>{copy.thanksTry}</h1>
          <p className="uninstall-question">
            <span>
              {questionParts[0]}
              <strong>{extension.name}</strong>
              {questionParts.slice(1).join("{name}")}
            </span>
            <small>{copy.oneAnswer}</small>
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
                <div className="uninstall-card-meta">
                  <p className="uninstall-kicker">{copy.whatHappened}</p>
                  <span className="uninstall-anonymous" title={copy.anonymousNotice}>
                    <span className="uninstall-lock" aria-hidden="true" />
                    {copy.anonymousFeedback}
                  </span>
                </div>
                <h2>{copy.chooseReason}</h2>
              </div>

              <div className="uninstall-reasons">
                {reasons.map(([value, label, icon, tone]) => (
                  <button
                    className={reason === value ? "selected" : ""}
                    key={value}
                    type="button"
                    aria-pressed={reason === value}
                    onClick={() => { setReason(value); setState("idle"); }}
                  >
                    <span className={`uninstall-reason-icon uninstall-reason-icon--${tone}`} aria-hidden="true">{icon}</span>
                    <strong>{label}</strong>
                  </button>
                ))}
              </div>

              <button
                className={`uninstall-other${reason === "other" ? " selected" : ""}`}
                type="button"
                aria-pressed={reason === "other"}
                onClick={() => { setReason("other"); setState("idle"); }}
              >
                {copy.reasonOther}
              </button>

              {reason ? (
                <>
                  {recovery ? (
                    <div className="uninstall-recovery">
                      <div>
                        <small>{locale === "en" ? "We may be able to help" : copy.whatHappened}</small>
                        <strong>{retentionMessage}</strong>
                      </div>
                      <a
                        href={recovery.href}
                        target={recovery.href.startsWith("http") ? "_blank" : undefined}
                        rel={recovery.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {recovery.label}
                      </a>
                    </div>
                  ) : null}
                  <label className="uninstall-comment">
                    <span>{followUp} <small>{copy.optional}</small></span>
                    <textarea
                      value={comment}
                      maxLength={1000}
                      rows={2}
                      placeholder={copy.notePlaceholder}
                      onChange={(event) => setComment(event.target.value)}
                    />
                  </label>
                </>
              ) : null}

              <div className="uninstall-actions">
                <button className="uninstall-submit" type="submit" disabled={!reason || state === "sending"}>
                  {state === "sending" ? copy.sending : copy.sendFeedback}
                </button>
                <button className="uninstall-skip" type="button" onClick={() => setState("skipped")}>
                  {copy.skipFeedback}
                </button>
              </div>
              {state === "error" ? <p className="uninstall-error">{copy.sendError}</p> : null}
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
