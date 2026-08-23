"use client";

import { useMemo, useState } from "react";
import type { UninstallFeedbackSnapshot } from "@/lib/uninstall-feedback";

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortDay(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function FeedbackView({ snapshot }: { snapshot: UninstallFeedbackSnapshot }) {
  const [query, setQuery] = useState("");
  const [extension, setExtension] = useState("all");
  const [reason, setReason] = useState("all");

  const visible = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return snapshot.events.filter((event) => {
      if (extension !== "all" && event.extension !== extension) return false;
      if (reason !== "all" && event.reason !== reason) return false;
      const haystack = [
        event.extension,
        event.extensionName,
        event.version,
        event.reason,
        event.reasonLabel,
        event.locale ?? "",
        event.comment ?? "",
      ].join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [snapshot, query, extension, reason]);

  const chartMax = Math.max(1, ...snapshot.daily.map((item) => item.count));
  const activeReasons = snapshot.byReason.filter((item) => item.count > 0);
  const reasonMax = Math.max(1, ...activeReasons.map((item) => item.count));

  return (
    <>
      <section className="crash-stats feedback-stats" aria-label="Uninstall feedback totals">
        <div><span>Total responses</span><strong>{snapshot.totalResponses}</strong></div>
        <div><span>Last 24 hours</span><strong>{snapshot.last24Hours}</strong></div>
        <div><span>Last 7 days</span><strong>{snapshot.last7Days}</strong></div>
        <div><span>Written comments</span><strong>{snapshot.withComments}</strong></div>
        <div><span>Comment rate</span><strong>{snapshot.totalResponses ? Math.round((snapshot.withComments / snapshot.totalResponses) * 100) : 0}%</strong></div>
      </section>

      <div className="crash-overview feedback-overview">
        <section className="crash-panel" aria-labelledby="feedback-activity-title">
          <div className="crash-panel-head">
            <h2 id="feedback-activity-title">14-day uninstall feedback</h2>
            <span>{snapshot.retentionDays}-day retention</span>
          </div>
          <div className="crash-chart">
            {snapshot.daily.map((item) => (
              <div className="crash-bar-cell" key={item.day} title={`${item.day}: ${item.count}`}>
                <span className="crash-bar-value">{item.count || ""}</span>
                <span className="crash-bar feedback-chart-bar" style={{ height: `${Math.max(3, (item.count / chartMax) * 100)}%` }} />
                <span className="crash-bar-label">{shortDay(item.day)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="crash-panel" aria-labelledby="feedback-reasons-title">
          <div className="crash-panel-head"><h2 id="feedback-reasons-title">Why people uninstall</h2></div>
          <div className="feedback-reason-list">
            {activeReasons.map((item) => (
              <button type="button" key={item.reason} onClick={() => setReason(item.reason)}>
                <span><strong>{item.label}</strong><small>{item.count} response{item.count === 1 ? "" : "s"}</small></span>
                <i><span style={{ width: `${(item.count / reasonMax) * 100}%` }} /></i>
              </button>
            ))}
            {!activeReasons.length && <p className="vault-muted">No uninstall feedback received yet.</p>}
          </div>
        </section>
      </div>

      <section className="crash-panel feedback-products" aria-labelledby="feedback-products-title">
        <div className="crash-panel-head"><h2 id="feedback-products-title">Every extension</h2></div>
        <div className="feedback-product-grid">
          {snapshot.byExtension.map((item) => (
            <button type="button" key={item.extension} onClick={() => setExtension(item.extension)}>
              <span><strong>{item.name}</strong><small>{item.versions.length ? `v${item.versions.join(", ")}` : "No responses yet"}</small></span>
              <span><strong>{item.responses}</strong><small>{item.withComments} comments</small></span>
            </button>
          ))}
        </div>
      </section>

      <div className="vault-controls crash-controls feedback-controls">
        <input
          className="vault-input"
          placeholder="Search reason, comment, locale, extension, version…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={extension} onChange={(event) => setExtension(event.target.value)} aria-label="Extension filter">
          <option value="all">All extensions</option>
          {snapshot.byExtension.map((item) => <option key={item.extension} value={item.extension}>{item.name}</option>)}
        </select>
        <select value={reason} onChange={(event) => setReason(event.target.value)} aria-label="Reason filter">
          <option value="all">All reasons</option>
          {activeReasons.map((item) => <option key={item.reason} value={item.reason}>{item.label}</option>)}
        </select>
      </div>

      {snapshot.truncated && <p className="vault-error">Showing the newest 5,000 retained responses.</p>}

      <div className="vault-table-wrap">
        <table className="vault-table feedback-table">
          <thead><tr><th>Received</th><th>Extension</th><th>Version</th><th>Reason</th><th>Locale</th><th>Written feedback</th></tr></thead>
          <tbody>
            {visible.map((event) => (
              <tr key={event.id}>
                <td>{fmtDate(event.receivedAt)}</td>
                <td className="crash-extension-cell"><strong>{event.extensionName}</strong><small>{event.extension}</small></td>
                <td>{event.version}</td>
                <td><strong>{event.reasonLabel}</strong><small className="feedback-reason-code">{event.reason}</small></td>
                <td>{event.locale ?? "unknown"}</td>
                <td className="feedback-comment">{event.comment || <span className="vault-muted">No written comment</span>}</td>
              </tr>
            ))}
            {!visible.length && <tr><td colSpan={6} className="vault-empty">No matching feedback.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="vault-muted vault-foot">Showing {visible.length} of {snapshot.totalResponses} responses.</p>
    </>
  );
}
