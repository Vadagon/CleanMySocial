"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CrashIssue, CrashSnapshot } from "@/lib/crashes";

const TOKEN_STORAGE_KEY = "cms-vault-token";

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

function issueHaystack(issue: CrashIssue): string {
  return [
    issue.fingerprint,
    issue.extension,
    issue.extensionName,
    issue.name,
    issue.code,
    issue.message,
    ...issue.versions,
    ...issue.sources,
  ].join(" ").toLowerCase();
}

export default function CrashDashboard() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [snapshot, setSnapshot] = useState<CrashSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [extension, setExtension] = useState("all");
  const [version, setVersion] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) {
      setToken(saved);
      setTokenInput(saved);
    }
  }, []);

  const load = useCallback(async (adminToken: string) => {
    if (!adminToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/crashes", {
        headers: { "x-admin-token": adminToken },
        cache: "no-store",
      });
      const json = await response.json();
      if (!response.ok) {
        setSnapshot(null);
        setError(json?.error || `Request failed (${response.status})`);
        if (response.status === 401) window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        return;
      }
      setSnapshot(json as CrashSnapshot);
      window.localStorage.setItem(TOKEN_STORAGE_KEY, adminToken);
    } catch (caught) {
      setSnapshot(null);
      setError(caught instanceof Error ? caught.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) load(token);
  }, [token, load]);

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
      if (extension !== "all" && issue.extension !== extension) return false;
      if (version !== "all" && !issue.versions.includes(version)) return false;
      const haystack = issueHaystack(issue);
      return terms.every((term) => haystack.includes(term));
    });
  }, [snapshot, query, extension, version]);

  function download() {
    if (!snapshot) return;
    const blob = new Blob([JSON.stringify({ ...snapshot, issues: visible }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cleanmysocial-crashes-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!token) {
    return (
      <div className="vault-gate">
        <h1>Crash dashboard</h1>
        <p className="vault-muted">Enter the same admin token used by Vault.</p>
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
          <h1>Crash dashboard</h1>
          <p className="vault-muted">
            {snapshot
              ? `${snapshot.totalEvents} retained report${snapshot.totalEvents === 1 ? "" : "s"} · ${snapshot.totalOccurrences} occurrence${snapshot.totalOccurrences === 1 ? "" : "s"} · refreshed ${fmtDate(snapshot.fetchedAt)}`
              : loading ? "Loading…" : "No data"}
            {snapshot && !snapshot.storeConfigured && <> · <strong>in-memory store (Redis not configured)</strong></>}
          </p>
        </div>
        <div className="vault-actions">
          <a className="btn secondary" href="/vault">Vault</a>
          <button className="btn secondary" onClick={() => load(token)} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button className="btn secondary" onClick={download} disabled={!snapshot}>Export JSON</button>
          <button
            className="btn secondary"
            onClick={() => {
              window.localStorage.removeItem(TOKEN_STORAGE_KEY);
              setToken("");
              setSnapshot(null);
            }}
          >Lock</button>
        </div>
      </div>

      {error && <p className="vault-error">{error}</p>}

      {snapshot && (
        <>
          <section className="crash-stats" aria-label="Crash totals">
            <div><span>Last 24 hours</span><strong>{snapshot.last24Hours}</strong></div>
            <div><span>Last 7 days</span><strong>{snapshot.last7Days}</strong></div>
            <div><span>Unique issues</span><strong>{snapshot.uniqueIssues}</strong></div>
            <div><span>Affected installations</span><strong>{snapshot.affectedInstallations}</strong></div>
            <div><span>Total occurrences</span><strong>{snapshot.totalOccurrences}</strong></div>
          </section>

          <div className="crash-overview">
            <section className="crash-panel" aria-labelledby="crash-activity-title">
              <div className="crash-panel-head">
                <h2 id="crash-activity-title">14-day activity</h2>
                <span>{snapshot.retentionDays}-day retention</span>
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
            <select value={extension} onChange={(event) => setExtension(event.target.value)} aria-label="Extension filter">
              <option value="all">All extensions</option>
              {snapshot.byExtension.map((item) => <option key={item.extension} value={item.extension}>{item.name}</option>)}
            </select>
            <select value={version} onChange={(event) => setVersion(event.target.value)} aria-label="Version filter">
              <option value="all">All versions</option>
              {versions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          {snapshot.truncated && (
            <p className="vault-error">Showing the newest 5,000 retained reports. Export and totals reflect that window.</p>
          )}

          <div className="vault-table-wrap">
            <table className="vault-table crash-table">
              <thead><tr><th>Error</th><th>Extension</th><th>Versions</th><th>Occurrences</th><th>Installs</th><th>First seen</th><th>Last seen</th></tr></thead>
              <tbody>
                {visible.map((issue) => {
                  const issueKey = `${issue.extension}:${issue.fingerprint}`;
                  return (
                    <IssueRows
                      key={issueKey}
                      issue={issue}
                      expanded={expanded === issueKey}
                      onToggle={() => setExpanded(expanded === issueKey ? null : issueKey)}
                    />
                  );
                })}
                {!visible.length && !loading && <tr><td colSpan={7} className="vault-empty">No matching crash issues.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="vault-muted vault-foot">Showing {visible.length} of {snapshot.uniqueIssues} grouped issues.</p>
        </>
      )}
    </div>
  );
}

function IssueRows({ issue, expanded, onToggle }: { issue: CrashIssue; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="vault-row">
        <td className="crash-message-cell">
          <button type="button" className="crash-issue-button" onClick={onToggle} aria-expanded={expanded}>
            <strong>{issue.name}{issue.code ? ` · ${issue.code}` : ""}</strong>
            <span>{issue.message}</span>
            <code>{issue.fingerprint}</code>
          </button>
        </td>
        <td className="crash-extension-cell"><strong>{issue.extensionName}</strong><small>{issue.extension}</small></td>
        <td>{issue.versions.join(", ")}</td>
        <td><strong>{issue.count}</strong>{issue.reports !== issue.count && <small className="crash-report-count">{issue.reports} reports</small>}</td>
        <td><strong>{issue.affectedInstallations}</strong></td>
        <td>{fmtDate(issue.firstSeen)}</td>
        <td>{fmtDate(issue.lastSeen)}</td>
      </tr>
      {expanded && (
        <tr><td colSpan={7}>
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
