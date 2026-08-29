"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CrashIssue, CrashSnapshot } from "@/lib/crashes";
import type { CrashIssueStatus } from "@/lib/crash-status";
import type { UninstallFeedbackSnapshot } from "@/lib/uninstall-feedback";
import FeedbackView from "./FeedbackView";

const TOKEN_STORAGE_KEY = "cms-vault-token";
type RangePreset = "all" | "24h" | "7d" | "14d" | "30d" | "custom";
const RANGE_DURATIONS: Partial<Record<RangePreset, number>> = {
  "24h": 86_400_000,
  "7d": 7 * 86_400_000,
  "14d": 14 * 86_400_000,
  "30d": 30 * 86_400_000,
};
const STATUS_LABELS: Record<CrashIssueStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  fixed: "Fixed",
  ignored: "Ignored",
};

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

function dateStart(value: string): number {
  return new Date(`${value}T00:00:00`).getTime();
}

function dateEnd(value: string): number {
  return new Date(`${value}T23:59:59.999`).getTime();
}

function shortDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function inputDate(ms: number): string {
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function issueHaystack(issue: CrashIssue): string {
  return [
    issue.fingerprint,
    issue.extension,
    issue.extensionName,
    issue.name,
    issue.code,
    issue.message,
    issue.status,
    issue.trend ?? "",
    issue.impactLevel,
    ...issue.versions,
    ...issue.sources,
  ].join(" ").toLowerCase();
}

export default function CrashDashboard() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [snapshot, setSnapshot] = useState<CrashSnapshot | null>(null);
  const [feedback, setFeedback] = useState<UninstallFeedbackSnapshot | null>(null);
  const [tab, setTab] = useState<"crashes" | "feedback">("crashes");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [extension, setExtension] = useState("all");
  const [rangePreset, setRangePreset] = useState<RangePreset>("14d");
  const [presetAnchor, setPresetAnchor] = useState(() => Date.now());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [extensionOptions, setExtensionOptions] = useState<Array<{ extension: string; name: string; responses: number }>>([]);
  const [version, setVersion] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | CrashIssueStatus>("all");
  const [savingIssue, setSavingIssue] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const latestRequest = useRef(0);

  useEffect(() => {
    const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) {
      setToken(saved);
      setTokenInput(saved);
    }
  }, []);

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (extension !== "all") params.set("extension", extension);
    if (rangePreset === "custom") {
      if (dateFrom) params.set("from", String(dateStart(dateFrom)));
      if (dateTo) params.set("to", String(dateEnd(dateTo)));
    } else {
      const duration = RANGE_DURATIONS[rangePreset];
      if (duration) {
        params.set("from", String(presetAnchor - duration));
        params.set("to", String(presetAnchor));
      }
    }
    const value = params.toString();
    return value ? `?${value}` : "";
  }, [extension, rangePreset, presetAnchor, dateFrom, dateTo]);
  const rangeError = rangePreset === "custom" && !dateFrom && !dateTo
    ? "Choose at least one date."
    : rangePreset === "custom" && dateFrom && dateTo && dateFrom > dateTo
      ? "The start date must be before the end date."
      : null;
  const invalidRange = Boolean(rangeError);

  const load = useCallback(async (adminToken: string, queryString = "") => {
    const requestId = ++latestRequest.current;
    if (!adminToken) return;
    setLoading(true);
    setError(null);
    try {
      const options = { headers: { "x-admin-token": adminToken }, cache: "no-store" as const };
      const [crashResponse, feedbackResponse] = await Promise.all([
        fetch(`/api/admin/crashes${queryString}`, options),
        fetch(`/api/admin/feedback${queryString}`, options),
      ]);
      const [crashJson, feedbackJson] = await Promise.all([
        crashResponse.json(),
        feedbackResponse.json(),
      ]);
      const failed = !crashResponse.ok ? { response: crashResponse, json: crashJson } :
        !feedbackResponse.ok ? { response: feedbackResponse, json: feedbackJson } : null;
      if (failed) {
        if (requestId !== latestRequest.current) return;
        setSnapshot(null);
        setFeedback(null);
        setError(failed.json?.error || `Request failed (${failed.response.status})`);
        if (failed.response.status === 401) window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        return;
      }
      if (requestId !== latestRequest.current) return;
      setSnapshot(crashJson as CrashSnapshot);
      setFeedback(feedbackJson as UninstallFeedbackSnapshot);
      setExtensionOptions((current) => {
        const choices = new Map(current.map((item) => [item.extension, item]));
        for (const item of (crashJson as CrashSnapshot).byExtension) {
          const existing = choices.get(item.extension);
          choices.set(item.extension, { extension: item.extension, name: item.name, responses: existing?.responses ?? 0 });
        }
        for (const item of (feedbackJson as UninstallFeedbackSnapshot).byExtension) {
          choices.set(item.extension, { extension: item.extension, name: item.name, responses: item.responses });
        }
        return [...choices.values()].sort((a, b) => b.responses - a.responses || a.name.localeCompare(b.name));
      });
      window.localStorage.setItem(TOKEN_STORAGE_KEY, adminToken);
    } catch (caught) {
      if (requestId !== latestRequest.current) return;
      setSnapshot(null);
      setFeedback(null);
      setError(caught instanceof Error ? caught.message : "Network error");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token && !invalidRange) load(token, filterQuery);
  }, [token, filterQuery, invalidRange, load]);

  const dateRangeLabel = useMemo(() => {
    if (rangePreset === "all") return "All retained data";
    if (rangePreset === "24h") return "Last 24 hours";
    if (rangePreset === "7d") return "Last 7 days";
    if (rangePreset === "14d") return "Last 14 days";
    if (rangePreset === "30d") return "Last 30 days";
    if (dateFrom && dateTo) return `${shortDate(dateStart(dateFrom))} – ${shortDate(dateEnd(dateTo))}`;
    if (dateFrom) return `Since ${shortDate(dateStart(dateFrom))}`;
    if (dateTo) return `Through ${shortDate(dateEnd(dateTo))}`;
    return "Custom date range";
  }, [rangePreset, dateFrom, dateTo]);
  const hasFilteredDateRange = rangePreset !== "all";
  const activityRangeLabel = hasFilteredDateRange ? dateRangeLabel : "Last 14 days";

  useEffect(() => {
    if (version !== "all" && snapshot && !snapshot.issues.some((issue) => issue.versions.includes(version))) {
      setVersion("all");
    }
  }, [snapshot, version]);

  const versions = useMemo(() => {
    if (!snapshot) return [];
    return [...new Set(snapshot.issues.flatMap((issue) => issue.versions))].sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true }),
    );
  }, [snapshot]);

  const visible = useMemo(() => {
    if (!snapshot) return [];
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return snapshot.issues.filter((issue) => {
      if (version !== "all" && !issue.versions.includes(version)) return false;
      if (statusFilter !== "all" && issue.status !== statusFilter) return false;
      const haystack = issueHaystack(issue);
      return terms.every((term) => haystack.includes(term));
    });
  }, [snapshot, query, version, statusFilter]);

  function download() {
    const payload = tab === "crashes"
      ? snapshot && { ...snapshot, issues: visible }
      : feedback;
    if (!payload) return;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cleanmysocial-${tab}-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function updateIssueStatus(issue: CrashIssue, status: CrashIssueStatus) {
    if (!snapshot || status === issue.status) return;
    const key = `${issue.extension}:${issue.fingerprint}`;
    const previous = issue.status;
    setSavingIssue(key);
    setSnapshot({
      ...snapshot,
      issues: snapshot.issues.map((item) => item === issue ? { ...item, status, statusUpdatedAt: Date.now() } : item),
    });
    try {
      const response = await fetch("/api/admin/crashes/status", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ extension: issue.extension, fingerprint: issue.fingerprint, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || `Request failed (${response.status})`);
      setSnapshot((current) => current ? {
        ...current,
        issues: current.issues.map((item) =>
          item.extension === issue.extension && item.fingerprint === issue.fingerprint
            ? { ...item, status, statusUpdatedAt: Number(result.updatedAt) || Date.now() }
            : item,
        ),
      } : current);
    } catch (caught) {
      setSnapshot((current) => current ? {
        ...current,
        issues: current.issues.map((item) =>
          item.extension === issue.extension && item.fingerprint === issue.fingerprint
            ? { ...item, status: previous }
            : item,
        ),
      } : current);
      setError(caught instanceof Error ? caught.message : "Could not update issue status");
    } finally {
      setSavingIssue(null);
    }
  }

  if (!token) {
    return (
      <div className="vault-gate">
        <h1>Product health</h1>
        <p className="vault-muted">Enter the same admin password used by Vault.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setToken(tokenInput.trim());
          }}
        >
          <input
            className="vault-input"
            type="password"
            autoComplete="off"
            placeholder="ADMIN_TOKEN"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
          />
          <button className="btn" type="submit" style={{ marginTop: 12 }}>Unlock</button>
        </form>
        {error && <p className="vault-error">{error}</p>}
      </div>
    );
  }

  const chartMax = Math.max(1, ...(snapshot?.daily.map((item) => item.count) ?? [1]));

  return (
    <div className="vault crash-dashboard">
      <div className="vault-head">
        <div>
          <h1>Product health</h1>
          <p className="vault-muted">
            {tab === "crashes" && snapshot
              ? `${snapshot.totalEvents} retained report${snapshot.totalEvents === 1 ? "" : "s"} · ${snapshot.totalOccurrences} occurrence${snapshot.totalOccurrences === 1 ? "" : "s"} · refreshed ${fmtDate(snapshot.fetchedAt)}`
              : tab === "feedback" && feedback
                ? `${feedback.totalResponses} retained response${feedback.totalResponses === 1 ? "" : "s"} · ${feedback.withComments} written comment${feedback.withComments === 1 ? "" : "s"} · refreshed ${fmtDate(feedback.fetchedAt)}`
                : loading ? "Loading…" : "No data"}
            {tab === "crashes" && snapshot && !snapshot.storeConfigured && <> · <strong>in-memory store (Redis not configured)</strong></>}
            {tab === "feedback" && feedback && !feedback.storeConfigured && <> · <strong>in-memory store (Redis not configured)</strong></>}
          </p>
        </div>
        <div className="vault-actions">
          <a className="btn secondary" href="/vault">Vault</a>
          <button
            className="btn secondary"
            onClick={() => {
              if (RANGE_DURATIONS[rangePreset]) setPresetAnchor(Date.now());
              else load(token, filterQuery);
            }}
            disabled={loading || invalidRange}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button className="btn secondary" onClick={download} disabled={tab === "crashes" ? !snapshot : !feedback}>Export JSON</button>
          <button
            className="btn secondary"
            onClick={() => {
              window.localStorage.removeItem(TOKEN_STORAGE_KEY);
              setToken("");
              setSnapshot(null);
              setFeedback(null);
            }}
          >Lock</button>
        </div>
      </div>

      {error && <p className="vault-error">{error}</p>}

      {(snapshot || feedback) && (
        <div className="health-tabs" role="tablist" aria-label="Product health views">
          <button type="button" role="tab" aria-selected={tab === "crashes"} className={tab === "crashes" ? "active" : ""} onClick={() => setTab("crashes")}>Crashes <small>{snapshot?.totalOccurrences ?? 0}</small></button>
          <button type="button" role="tab" aria-selected={tab === "feedback"} className={tab === "feedback" ? "active" : ""} onClick={() => setTab("feedback")}>Uninstall feedback <small>{feedback?.totalResponses ?? 0}</small></button>
        </div>
      )}

      {(snapshot || feedback) && (
        <section className={`health-filters${rangePreset === "custom" ? " health-filters--custom" : ""}`} aria-label="Dashboard filters">
          <label>
            <span>Extension</span>
            <select value={extension} onChange={(event) => setExtension(event.target.value)}>
              <option value="all">All extensions</option>
              {extensionOptions.map((item) => <option key={item.extension} value={item.extension}>{item.name}{tab === "feedback" ? ` · ${item.responses} responses` : ""}</option>)}
            </select>
          </label>
          <label>
            <span>Range</span>
            <select
              value={rangePreset}
              onChange={(event) => {
                const next = event.target.value as RangePreset;
                setRangePreset(next);
                setPresetAnchor(Date.now());
                if (next === "custom" && !dateFrom && !dateTo) {
                  setDateFrom(inputDate(Date.now() - 13 * 86_400_000));
                  setDateTo(inputDate(Date.now()));
                } else if (next !== "custom") {
                  setDateFrom("");
                  setDateTo("");
                }
              }}
            >
              <option value="all">All retained</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="14d">Last 14 days</option>
              <option value="30d">Last 30 days</option>
              <option value="custom">Custom dates</option>
            </select>
          </label>
          {rangePreset === "custom" && <>
            <label>
              <span>From</span>
              <input type="date" value={dateFrom} max={dateTo || inputDate(Date.now())} onChange={(event) => setDateFrom(event.target.value)} />
            </label>
            <label>
              <span>To</span>
              <input type="date" value={dateTo} min={dateFrom || undefined} max={inputDate(Date.now())} onChange={(event) => setDateTo(event.target.value)} />
            </label>
          </>}
          <button
            className="btn secondary health-clear-filters"
            type="button"
            disabled={extension === "all" && rangePreset === "14d"}
            onClick={() => {
              setExtension("all");
              setRangePreset("14d");
              setPresetAnchor(Date.now());
              setDateFrom("");
              setDateTo("");
            }}
          >Reset</button>
          <p className={invalidRange ? "vault-error" : "vault-muted"}>
            {rangeError || `${extension === "all" ? "All extensions" : extensionOptions.find((item) => item.extension === extension)?.name || extension} · ${dateRangeLabel}`}
          </p>
        </section>
      )}

      {tab === "crashes" && snapshot && (
        <>
          <section className="crash-stats" aria-label="Crash totals">
            <div><span>Last 24 hours</span><strong>{snapshot.last24Hours}</strong></div>
            <div><span>Last 7 days</span><strong>{snapshot.last7Days}</strong></div>
            <div><span>Actionable issues</span><strong>{snapshot.issues.filter((issue) => issue.trend || issue.status === "open" || issue.status === "investigating").length}</strong></div>
            <div><span>Affected installations</span><strong>{snapshot.affectedInstallations}</strong></div>
            <div><span>Total occurrences</span><strong>{snapshot.totalOccurrences}</strong></div>
          </section>

          <div className="crash-overview">
            <section className="crash-panel" aria-labelledby="crash-activity-title">
              <div className="crash-panel-head">
                <h2 id="crash-activity-title">{hasFilteredDateRange ? "Activity in selected range" : "14-day activity"}</h2>
                <span>{activityRangeLabel}</span>
              </div>
              <div className="crash-chart">
                {snapshot.daily.map((item) => (
                  <div className="crash-bar-cell" key={item.day} title={`${item.day}: ${item.count}`}>
                    <span className="crash-bar-value">{item.count || ""}</span>
                    <span className="crash-bar" style={{ height: `${Math.max(3, (item.count / chartMax) * 100)}%` }} />
                    <span className="crash-bar-label">{shortDay(item.day)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="crash-panel" aria-labelledby="crash-products-title">
              <div className="crash-panel-head"><h2 id="crash-products-title">By extension</h2></div>
              <div className="crash-product-list">
                {snapshot.byExtension.map((item) => (
                  <button key={item.extension} type="button" onClick={() => setExtension(item.extension)}>
                    <span><strong>{item.name}</strong><small>{item.versions.join(", ")}</small></span>
                    <span><strong>{item.events}</strong><small>{item.affectedInstallations} installs · {item.issues} issues</small></span>
                  </button>
                ))}
                {!snapshot.byExtension.length && <p className="vault-muted">No crashes received yet.</p>}
              </div>
            </section>
          </div>

          <div className="vault-controls crash-controls">
            <input
              className="vault-input"
              placeholder="Search error, code, source, extension, version…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select value={version} onChange={(event) => setVersion(event.target.value)} aria-label="Version filter">
              <option value="all">All versions</option>
              {versions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | CrashIssueStatus)} aria-label="Issue status filter">
              <option value="all">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          {snapshot.truncated && (
            <p className="vault-error">Showing the newest 5,000 matching retained reports. Export and totals reflect that window.</p>
          )}

          <div className="vault-table-wrap">
            <table className="vault-table crash-table">
              <thead><tr><th>Error</th><th>Status</th><th>Impact</th><th>Extension</th><th>Versions</th><th>Occurrences</th><th>Installs</th><th>First seen</th><th>Last seen</th></tr></thead>
              <tbody>
                {visible.map((issue) => {
                  const issueKey = `${issue.extension}:${issue.fingerprint}`;
                  return (
                    <IssueRows
                      key={issueKey}
                      issue={issue}
                      expanded={expanded === issueKey}
                      saving={savingIssue === issueKey}
                      onToggle={() => setExpanded(expanded === issueKey ? null : issueKey)}
                      onStatusChange={(status) => updateIssueStatus(issue, status)}
                    />
                  );
                })}
                {!visible.length && !loading && <tr><td colSpan={9} className="vault-empty">No matching crash issues.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="vault-muted vault-foot">Showing {visible.length} of {snapshot.uniqueIssues} grouped issues.</p>
        </>
      )}

      {tab === "feedback" && feedback && (
        <FeedbackView
          snapshot={feedback}
          dateRangeLabel={activityRangeLabel}
          hasCustomDateRange={hasFilteredDateRange}
        />
      )}
    </div>
  );
}

function IssueRows({
  issue,
  expanded,
  saving,
  onToggle,
  onStatusChange,
}: {
  issue: CrashIssue;
  expanded: boolean;
  saving: boolean;
  onToggle: () => void;
  onStatusChange: (status: CrashIssueStatus) => void;
}) {
  return (
    <>
      <tr className="vault-row">
        <td className="crash-message-cell">
          <button type="button" className="crash-issue-button" onClick={onToggle} aria-expanded={expanded}>
            <span className="crash-issue-heading">
              <strong>{issue.name}{issue.code ? ` · ${issue.code}` : ""}</strong>
              {issue.trend && <em className={`crash-trend crash-trend--${issue.trend}`}>{issue.trend === "new" ? "New" : "Regressed"}</em>}
            </span>
            <span>{issue.message}</span>
            <code>{issue.fingerprint}</code>
          </button>
        </td>
        <td>
          <select
            className={`crash-status crash-status--${issue.status}`}
            value={issue.status}
            disabled={saving}
            aria-label={`Status for ${issue.name}`}
            onChange={(event) => onStatusChange(event.target.value as CrashIssueStatus)}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </td>
        <td>
          <span className={`crash-impact crash-impact--${issue.impactLevel}`} title={`Impact score ${issue.impactScore}`}>
            {issue.impactLevel}
          </span>
        </td>
        <td className="crash-extension-cell"><strong>{issue.extensionName}</strong><small>{issue.extension}</small></td>
        <td>{issue.versions.join(", ")}</td>
        <td><strong>{issue.count}</strong>{issue.reports !== issue.count && <small className="crash-report-count">{issue.reports} reports</small>}</td>
        <td><strong>{issue.affectedInstallations}</strong></td>
        <td>{fmtDate(issue.firstSeen)}</td>
        <td>{fmtDate(issue.lastSeen)}</td>
      </tr>
      {expanded && (
        <tr><td colSpan={9}>
          <div className="crash-occurrences">
            <h3>Recent occurrences</h3>
            {issue.recent.map((event) => (
              <article key={event.id}>
                <div>
                  <strong>{fmtDate(event.occurredAt)}{event.occurrences > 1 ? ` · ${event.occurrences} occurrences` : ""}</strong>
                  <span>v{event.version} · {event.source}{event.extensionId ? ` · ${event.extensionId}` : ""}{event.locale ? ` · ${event.locale}` : ""}{event.platform ? ` · ${event.platform}` : ""}</span>
                </div>
                <p>{event.message}</p>
                {event.stack && <pre>{event.stack}</pre>}
              </article>
            ))}
          </div>
        </td></tr>
      )}
    </>
  );
}
