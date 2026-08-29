"use client";

import { useEffect, useMemo, useState } from "react";
import type { UninstallFeedbackSnapshot, UninstallReason } from "@/lib/uninstall-feedback";

const PRODUCT_ISSUE_REASONS = new Set<UninstallReason>(["not_working", "hard_to_use", "too_slow", "missing_feature", "privacy"]);

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function shortDay(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function percent(value: number, total: number): number {
  return total ? Math.round((value / total) * 100) : 0;
}

function deltaLabel(delta: number): string {
  if (!delta) return "No change";
  return `${delta > 0 ? "+" : ""}${delta}`;
}

function MetricCard({ label, value, detail, delta, comparisonAvailable, comparisonEmpty, inverse = false }: {
  label: string;
  value: string | number;
  detail: string;
  delta: number;
  comparisonAvailable: boolean;
  comparisonEmpty: boolean;
  inverse?: boolean;
}) {
  const tone = delta === 0 ? "neutral" : (inverse ? delta < 0 : delta > 0) ? "good" : "bad";
  return (
    <div className="feedback-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
      <div>
        <small>{detail}</small>
        <em className={`feedback-delta feedback-delta--${tone}`}>
          {comparisonAvailable ? `${deltaLabel(delta)} vs previous` : comparisonEmpty ? "No prior responses" : "All retained data"}
        </em>
      </div>
    </div>
  );
}

export default function FeedbackView({ snapshot, dateRangeLabel, hasCustomDateRange }: {
  snapshot: UninstallFeedbackSnapshot;
  dateRangeLabel: string;
  hasCustomDateRange: boolean;
}) {
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("all");

  const visible = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return snapshot.events.filter((event) => {
      if (reason !== "all" && event.reason !== reason) return false;
      const haystack = [event.extension, event.extensionName, event.version, event.reason, event.reasonLabel, event.locale ?? "", event.comment ?? ""].join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [snapshot, query, reason]);

  const chartMax = Math.max(1, ...snapshot.daily.map((item) => item.count));
  const activeReasons = useMemo(() => snapshot.byReason.filter((item) => item.count > 0).sort((a, b) => b.count - a.count), [snapshot.byReason]);
  const rankedReasons = activeReasons.slice(0, 6);
  const remainingReasonResponses = activeReasons.slice(6).reduce((sum, item) => sum + item.count, 0);
  const comments = snapshot.events.filter((event) => event.comment).slice(0, 6);
  const previousReasons = new Map(snapshot.comparison?.byReason.map((item) => [item.reason, item.count]) ?? []);
  const previousTotal = snapshot.comparison?.totalResponses ?? 0;
  const comparisonAvailable = Boolean(snapshot.comparison && previousTotal > 0);
  const comparisonEmpty = Boolean(snapshot.comparison && previousTotal === 0);
  const productIssues = snapshot.byReason.filter((item) => PRODUCT_ISSUE_REASONS.has(item.reason)).reduce((sum, item) => sum + item.count, 0);
  const previousProductIssues = snapshot.comparison?.byReason.filter((item) => PRODUCT_ISSUE_REASONS.has(item.reason)).reduce((sum, item) => sum + item.count, 0) ?? 0;
  const priceCount = snapshot.byReason.find((item) => item.reason === "price")?.count ?? 0;
  const previousPriceCount = previousReasons.get("price") ?? 0;
  const commentRate = percent(snapshot.withComments, snapshot.totalResponses);
  const previousCommentRate = percent(snapshot.comparison?.withComments ?? 0, previousTotal);

  useEffect(() => {
    if (reason !== "all" && !activeReasons.some((item) => item.reason === reason)) setReason("all");
  }, [activeReasons, reason]);

  return (
    <>
      <section className="feedback-kpis" aria-label="Uninstall feedback signals">
        <MetricCard label="Responses" value={snapshot.totalResponses} detail={dateRangeLabel} delta={snapshot.totalResponses - previousTotal} comparisonAvailable={comparisonAvailable} comparisonEmpty={comparisonEmpty} />
        <MetricCard label="Product issues" value={`${percent(productIssues, snapshot.totalResponses)}%`} detail={`${productIssues} cite reliability, usability or privacy`} delta={percent(productIssues, snapshot.totalResponses) - percent(previousProductIssues, previousTotal)} comparisonAvailable={comparisonAvailable} comparisonEmpty={comparisonEmpty} inverse />
        <MetricCard label="Price concern" value={`${percent(priceCount, snapshot.totalResponses)}%`} detail={`${priceCount} said it was too expensive`} delta={percent(priceCount, snapshot.totalResponses) - percent(previousPriceCount, previousTotal)} comparisonAvailable={comparisonAvailable} comparisonEmpty={comparisonEmpty} inverse />
        <MetricCard label="Written feedback" value={snapshot.withComments} detail={`${commentRate}% include context`} delta={commentRate - previousCommentRate} comparisonAvailable={comparisonAvailable} comparisonEmpty={comparisonEmpty} />
      </section>

      <div className="crash-overview feedback-overview">
        <section className="crash-panel feedback-trend-panel" aria-labelledby="feedback-activity-title">
          <div className="crash-panel-head feedback-panel-heading">
            <div><h2 id="feedback-activity-title">Uninstall trend</h2><p>{hasCustomDateRange ? "Responses in the selected period" : "Daily responses reveal sudden changes"}</p></div>
            <span>{dateRangeLabel}</span>
          </div>
          <div className="crash-chart feedback-chart">
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
          <div className="crash-panel-head feedback-panel-heading">
            <div><h2 id="feedback-reasons-title">Ranked reasons</h2><p>Click a reason to filter the responses below</p></div>
            {reason !== "all" && <button type="button" onClick={() => setReason("all")}>Clear</button>}
          </div>
          <div className="feedback-reason-list">
            {rankedReasons.map((item) => {
              const share = percent(item.count, snapshot.totalResponses);
              const previousShare = percent(previousReasons.get(item.reason) ?? 0, previousTotal);
              return (
                <button type="button" className={reason === item.reason ? "active" : ""} key={item.reason} onClick={() => setReason(reason === item.reason ? "all" : item.reason)}>
                  <span><strong>{item.label}</strong><small>{item.count} response{item.count === 1 ? "" : "s"}</small></span>
                  <span className="feedback-reason-share"><strong>{share}%</strong><small>{comparisonAvailable ? `${deltaLabel(share - previousShare)} pts` : "of responses"}</small></span>
                  <i><span style={{ width: `${share}%` }} /></i>
                </button>
              );
            })}
            {remainingReasonResponses > 0 && <p className="feedback-reason-more">{activeReasons.length - rankedReasons.length} other reasons · {remainingReasonResponses} responses</p>}
            {!activeReasons.length && <p className="vault-muted">No uninstall feedback received yet.</p>}
          </div>
        </section>
      </div>

      <section className="crash-panel feedback-comments-panel" aria-labelledby="feedback-comments-title">
        <div className="crash-panel-head feedback-panel-heading">
          <div><h2 id="feedback-comments-title">Latest written feedback</h2><p>Qualitative context behind the numbers</p></div>
          <span>{snapshot.withComments} total</span>
        </div>
        <div className="feedback-comment-grid">
          {comments.map((event) => (
            <article key={event.id}>
              <p>“{event.comment}”</p>
              <footer><strong>{event.extensionName}</strong><span>{event.reasonLabel} · {event.locale ?? "unknown locale"} · {fmtDate(event.receivedAt)}</span></footer>
            </article>
          ))}
          {!comments.length && <p className="vault-muted">No written comments in this period.</p>}
        </div>
      </section>

      <section className="feedback-responses" aria-labelledby="feedback-responses-title">
        <div className="feedback-responses-head">
          <div><h2 id="feedback-responses-title">All responses</h2><p>{reason === "all" ? "Search the complete response log" : `Filtered by ${activeReasons.find((item) => item.reason === reason)?.label ?? reason}`}</p></div>
          <div className="vault-controls crash-controls crash-table-controls feedback-controls">
            <input className="vault-input" placeholder="Search comment, locale, extension, version…" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select value={reason} onChange={(event) => setReason(event.target.value)} aria-label="Reason filter">
              <option value="all">All reasons</option>
              {activeReasons.map((item) => <option key={item.reason} value={item.reason}>{item.label}</option>)}
            </select>
          </div>
        </div>

        {snapshot.truncated && <p className="vault-error">Showing the newest 5,000 matching retained responses.</p>}
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
      </section>
    </>
  );
}
