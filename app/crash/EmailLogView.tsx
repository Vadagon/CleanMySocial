"use client";

import { useMemo, useState } from "react";
import type { EmailLogEntry, EmailLogKind, EmailLogSnapshot, EmailLogStatus } from "@/lib/email-log";

const KIND_LABELS: Record<EmailLogKind, string> = {
  license: "License",
  abandoned_checkout: "Abandoned checkout",
  breakage_report: "Breakage report",
  crash_alert: "Crash alert",
  trustpilot_invite: "Trustpilot invite",
};

const STATUS_LABELS: Record<EmailLogStatus, string> = {
  sent: "Sent",
  rejected: "Rejected",
  failed: "Failed",
  skipped: "Skipped",
};

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function haystack(entry: EmailLogEntry): string {
  return [
    entry.subject, entry.from, ...entry.to, entry.replyTo, entry.kind, entry.status,
    entry.extension, entry.productId, entry.version, entry.code, entry.fingerprint,
    entry.messageId, entry.error, entry.text,
  ].filter(Boolean).join(" ").toLowerCase();
}

export default function EmailLogView({ snapshot }: { snapshot: EmailLogSnapshot }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | EmailLogStatus>("all");
  const [kind, setKind] = useState<"all" | EmailLogKind>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return snapshot.entries.filter((entry) => {
      if (status !== "all" && entry.status !== status) return false;
      if (kind !== "all" && entry.kind !== kind) return false;
      const searchable = haystack(entry);
      return terms.every((term) => searchable.includes(term));
    });
  }, [snapshot.entries, query, status, kind]);

  return (
    <>
      <section className="crash-stats email-stats" aria-label="Email delivery totals">
        <div><span>Total logged</span><strong>{snapshot.total}</strong></div>
        <div><span>Sent</span><strong>{snapshot.sent}</strong></div>
        <div><span>Rejected</span><strong>{snapshot.rejected}</strong></div>
        <div><span>Failed or skipped</span><strong>{snapshot.failed + snapshot.skipped}</strong></div>
        <div><span>Delivery rate</span><strong>{snapshot.deliveryRate}%</strong></div>
      </section>

      <div className="vault-controls crash-controls email-controls">
        <input
          className="vault-input"
          placeholder="Search address, subject, content, extension…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={status} onChange={(event) => setStatus(event.target.value as "all" | EmailLogStatus)} aria-label="Delivery status filter">
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={kind} onChange={(event) => setKind(event.target.value as "all" | EmailLogKind)} aria-label="Email type filter">
          <option value="all">All email types</option>
          {Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {snapshot.truncated && <p className="vault-error">Showing the newest 1,000 matching emails.</p>}

      <div className="vault-table-wrap">
        <table className="vault-table email-table">
          <thead><tr><th>Sent at</th><th>Status</th><th>Type</th><th>To</th><th>Subject</th><th>Extension</th></tr></thead>
          <tbody>
            {visible.map((entry) => (
              <EmailRows
                key={entry.id}
                entry={entry}
                expanded={expanded === entry.id}
                onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
              />
            ))}
            {!visible.length && <tr><td colSpan={6} className="vault-empty">No matching emails.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="vault-muted vault-foot">Showing {visible.length} emails · retained for {snapshot.retentionDays} days.</p>
    </>
  );
}

function EmailRows({ entry, expanded, onToggle }: { entry: EmailLogEntry; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="vault-row email-row">
        <td>{fmtDate(entry.at)}</td>
        <td><span className={`email-status email-status--${entry.status}`}>{STATUS_LABELS[entry.status]}</span></td>
        <td>{KIND_LABELS[entry.kind]}</td>
        <td className="email-address">{entry.to.join(", ")}</td>
        <td className="email-subject">
          <button type="button" onClick={onToggle} aria-expanded={expanded}>
            <strong>{entry.subject}</strong>
            {entry.error && <small>{entry.error}</small>}
          </button>
        </td>
        <td>{entry.extension || "—"}</td>
      </tr>
      {expanded && (
        <tr className="vault-detail-row">
          <td colSpan={6}>
            <article className="email-detail">
              <dl>
                <div><dt>From</dt><dd>{entry.from}</dd></div>
                <div><dt>To</dt><dd>{entry.to.join(", ")}</dd></div>
                {entry.replyTo && <div><dt>Reply-to</dt><dd>{entry.replyTo}</dd></div>}
                <div><dt>Accepted</dt><dd>{entry.accepted.join(", ") || "—"}</dd></div>
                <div><dt>Rejected</dt><dd>{entry.rejected.join(", ") || "—"}</dd></div>
                {entry.messageId && <div><dt>Message ID</dt><dd>{entry.messageId}</dd></div>}
                {entry.productId && <div><dt>Product</dt><dd>{entry.productId}</dd></div>}
                {entry.version && <div><dt>Version</dt><dd>{entry.version}</dd></div>}
                {entry.code && <div><dt>Code</dt><dd>{entry.code}</dd></div>}
                {entry.fingerprint && <div><dt>Fingerprint</dt><dd>{entry.fingerprint}</dd></div>}
                {entry.error && <div><dt>Error</dt><dd>{entry.error}</dd></div>}
              </dl>
              <section>
                <h3>Plain-text content</h3>
                <pre>{entry.text || "No plain-text body."}</pre>
              </section>
              {entry.html && (
                <details>
                  <summary>HTML source</summary>
                  <pre>{entry.html}</pre>
                </details>
              )}
            </article>
          </td>
        </tr>
      )}
    </>
  );
}
