"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { LifecycleCopy } from "@/lib/lifecycle-copy";
import { htmlLocale, localeDirection, type Locale } from "@/lib/locales";
import { discountCopy } from "@/lib/discount-copy";
import { localePath } from "@/lib/locale-path";

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

function ReasonIcon({ reason }: { reason: string }) {
  if (reason === "not_working") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3.5 3.2 19h17.6L12 3.5Z" />
        <path d="M12 9v4.2M12 16.5h.01" />
      </svg>
    );
  }
  if (reason === "price") {
    return <span className="uninstall-price-symbol">$</span>;
  }
  if (reason === "one_time") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m5.5 12.3 4.1 4.1 8.9-9" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5.2 4.5h13.6A2.2 2.2 0 0 1 21 6.7v8.1a2.2 2.2 0 0 1-2.2 2.2H10l-4.8 3v-3A2.2 2.2 0 0 1 3 14.8V6.7a2.2 2.2 0 0 1 2.2-2.2Z" />
      <path d="M8 10.8h.01M12 10.8h.01M16 10.8h.01" />
    </svg>
  );
}

const PRICE_REASON: Partial<Record<Locale, string>> = {
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
  el: "Ήταν πολύ ακριβό",
  bg: "Беше твърде скъпо",
  sk: "Bolo to príliš drahé",
  hr: "Bilo je preskupo",
  sl: "Bilo je predrago",
  ms: "Harganya terlalu mahal",
  uk: "Було задорого",
  lt: "Buvo per brangu",
  lv: "Tas bija pārāk dārgs",
  et: "See oli liiga kallis",
  hi: "यह बहुत महँगा था",
  fil: "Masyadong mahal",
};

const ENGLISH_FOLLOW_UPS: Record<string, string> = {
  not_working: "What happened?",
  price: "What price would feel reasonable?",
  one_time: "Was this only a one-time cleanup?",
  other: "What made you uninstall it?",
};

const ENGLISH_RECOVERY_MESSAGES: Record<string, string> = {
  one_time: "Finished here? Try another cleanup tool.",
  other: "Tell us what happened.",
};

/**
 * Replay the pre-baked uninstall fallback from docs/CONVERSION-FUNNEL.md.
 *
 * Chrome gives a removed extension no chance to run code, so its last queued
 * milestones ride along in this page's query string. Ingestion is idempotent
 * by installation + item ID, so a POST racing with removal, a reload, or React
 * Strict Mode's double effect cannot create duplicate rows.
 */
async function ingestUninstallFallback(extension: string, locale: string): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const installationId = params.get("iid");
  if (!installationId) return;

  const parse = (value: string | null): unknown => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const queued = parse(params.get("events"));
  const failure = parse(params.get("error"));
  const items: Array<Record<string, unknown>> = [];

  if (Array.isArray(queued)) {
    for (const entry of queued.slice(0, 6)) {
      if (!entry || typeof entry !== "object") continue;
      const { id, name, at } = entry as Record<string, unknown>;
      items.push({ id, kind: "event", name, at });
    }
  }
  if (failure && typeof failure === "object" && !Array.isArray(failure)) {
    const { id, name, at } = failure as Record<string, unknown>;
    // The fallback carries only the stable error code, which stands in for
    // both the error name and its message.
    items.push({ id, kind: "error", name, code: name, at });
  }
  if (!items.length) return;

  const response = await fetch("/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      installationId,
      extension,
      version: params.get("version")?.slice(0, 40) || "",
      locale,
      source: "uninstall-fallback",
      items,
    }),
  });
  if (!response.ok) return;

  // Keep `version` for the survey, drop the anonymous identifiers so they do
  // not linger in a shared or bookmarked URL.
  const remaining = new URLSearchParams();
  const version = params.get("version");
  if (version) remaining.set("version", version);
  const query = remaining.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
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
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const fallbackSent = useRef(false);

  useEffect(() => {
    if (fallbackSent.current) return;
    fallbackSent.current = true;
    // Never surfaced: a failed replay must not disturb the survey, and the
    // extension is already gone, so there is nothing left to retry with.
    void ingestUninstallFallback(extension.slug, locale).catch(() => {});
  }, [extension.slug, locale]);

  const reasons = [
    ["not_working", copy.reasonNotWorking, "red"],
    ["price", PRICE_REASON[locale] ?? PRICE_REASON.en!, "yellow"],
    ["one_time", locale === "en" ? "I finished what I needed" : copy.reasonNoNeed, "mint"],
    ["other", copy.reasonOther, "slate"],
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
  const recovery = reason === "price"
      ? { href: `${localePath(locale, `/${extension.slug}`)}?discount=on#access-options`, label: offerCopy.claim }
      : reason === "one_time"
          ? { href: "/", label: copy.exploreAll }
          : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason || state === "sending") return;
    setState("sending");
    try {
      const submittedVersion = version || new URLSearchParams(window.location.search).get("version")?.slice(0, 40) || "";
      const response = await fetch("/api/uninstall-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extension: extension.slug, version: submittedVersion, reason, comment, locale }),
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
        <Link href={localePath(locale, "/")} className="uninstall-brand">
          <Image src="/icon.svg" alt="" width={28} height={28} priority />
          CleanMySocial
        </Link>
      </header>

      <div className="uninstall-layout">
        <section className="uninstall-intro">
          <div className="uninstall-artwork" aria-hidden="true">
            <span className="uninstall-rays uninstall-rays--top"><i /><i /><i /></span>
            <Image className="uninstall-product-icon" src={extension.icon} alt="" width={112} height={112} priority />
            <span className="uninstall-rays uninstall-rays--bottom"><i /><i /><i /></span>
          </div>
          <p className="uninstall-kicker">{copy.extensionUninstalled}</p>
          <h1 className="uninstall-question">
            {questionParts[0]}
            <a href={extension.storeUrl} target="_blank" rel="noopener noreferrer">
              <strong>{extension.name}</strong>
              <span aria-hidden="true">↗</span>
            </a>
            {questionParts.slice(1).join("{name}")}
          </h1>
        </section>

        <section
          className={`uninstall-card${state === "sent" ? " uninstall-card--complete" : ""}`}
          aria-live="polite"
        >
          {state === "sent" ? (
            <div className="uninstall-complete">
              <div className="uninstall-complete-heading">
                <span aria-hidden="true">✓</span>
                <div>
                  <p className="uninstall-kicker">{copy.feedbackReceived}</p>
                  <h2>{copy.thanksHelps}</h2>
                  <p>{copy.sentAnonymously}</p>
                </div>
              </div>

              <section className="uninstall-family" aria-labelledby="uninstall-family-title">
                <div className="uninstall-family-heading">
                  <p className="uninstall-kicker" id="uninstall-family-title">{copy.more}</p>
                  <Link href={localePath(locale, "/")}>{copy.exploreAll}</Link>
                </div>
                <div className="uninstall-family-grid">
                  {recommendations.map((item) => (
                    <Link href={localePath(locale, `/${item.slug}`)} className="uninstall-family-card" key={item.slug}>
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
              <div className="uninstall-reasons">
                {reasons.map(([value, label, tone]) => (
                  <button
                    className={reason === value ? "selected" : ""}
                    key={value}
                    type="button"
                    aria-pressed={reason === value}
                    onClick={() => { setReason(value); setState("idle"); }}
                  >
                    <span className={`uninstall-reason-icon uninstall-reason-icon--${tone}`} aria-hidden="true">
                      <ReasonIcon reason={value} />
                    </span>
                    <strong>{label}</strong>
                    <span className="uninstall-reason-state" aria-hidden="true">
                      {reason === value ? "✓" : ""}
                    </span>
                  </button>
                ))}
              </div>

              {reason ? (
                <>
                  {recovery ? (
                    <div className={`uninstall-recovery uninstall-recovery--${reason}`}>
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
                  {state !== "sending" ? <span aria-hidden="true">→</span> : null}
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
