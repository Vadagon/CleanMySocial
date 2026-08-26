"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type {
  EntitlementRow,
  LicenseStatus,
  RecordsSnapshot,
  RecordType,
  StoredRecord,
} from "@/lib/records";

type VaultSnapshot = RecordsSnapshot & {
  masterAccess?: { exactKey: string | null; prefix: string | null };
};

const TOKEN_STORAGE_KEY = "cms-vault-token";

const TYPES: (RecordType | "all")[] = [
  "all",
  "license",
  "purchase",
  "subscription",
  "pending",
  "undelivered",
  "reminded",
  "mailed",
  "sweep",
  "other",
];

/** Wording that matches what the customer experiences, not what Redis holds. */
const STATUS_LABEL: Record<Exclude<LicenseStatus, null>, string> = {
  active: "active",
  "partly-revoked": "partly revoked",
  revoked: "revoked",
  expired: "expired",
  empty: "no entitlements",
};

type SortKey = "at" | "key" | "type" | "email" | "ttl";

function fmtDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtTtl(ttl: number): string {
  if (ttl === -1) return "never";
  if (ttl === -2) return "—";
  if (ttl < 60) return `${ttl}s`;
  if (ttl < 3600) return `${Math.round(ttl / 60)}m`;
  if (ttl < 86400) return `${Math.round(ttl / 3600)}h`;
  return `${Math.round(ttl / 86400)}d`;
}

/** Every value on a record, lowercased, so the search box matches anything. */
function haystack(r: StoredRecord): string {
  return `${r.key} ${r.type} ${r.raw ?? ""} ${r.fields.activeSlugs.join(" ")}`.toLowerCase();
}

function statusClass(status: LicenseStatus): string {
  if (status === "active") return "vault-ok";
  if (status === "partly-revoked") return "vault-warn";
  return "vault-bad";
}

function grantLine(row: EntitlementRow): string {
  const bits = [row.access ?? "—"];
  if (row.productName) bits.push(row.productName);
  if (row.subscriptionStatus) bits.push(`sub: ${row.subscriptionStatus}`);
  if (row.currentPeriodEnd) bits.push(`paid through ${fmtDate(row.currentPeriodEnd)}`);
  if (row.revokedAt) bits.push(`${row.revokeReason || "revoked"} ${fmtDate(row.revokedAt)}`);
  return bits.join(" · ");
}

export default function RecordsBrowser() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [snapshot, setSnapshot] = useState<VaultSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [type, setType] = useState<RecordType | "all">("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("at");
  const [sortDesc, setSortDesc] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Remember the token so a reload does not mean re-typing it.
  useEffect(() => {
    const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) {
      setToken(saved);
      setTokenInput(saved);
    }
  }, []);

  const load = useCallback(async (t: string) => {
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/records", {
        headers: { "x-admin-token": t },
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        setSnapshot(null);
        setError(json?.error || `Request failed (${res.status})`);
        if (res.status === 401) window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        return;
      }
      setSnapshot(json as VaultSnapshot);
      window.localStorage.setItem(TOKEN_STORAGE_KEY, t);
    } catch (e) {
      setSnapshot(null);
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) load(token);
  }, [token, load]);

  const visible = useMemo(() => {
    if (!snapshot) return [];
    const q = query.trim().toLowerCase();
    const terms = q ? q.split(/\s+/) : [];

    const filtered = snapshot.records.filter((r) => {
      if (type !== "all" && r.type !== type) return false;
      if (activeOnly && r.fields.active !== true) return false;
      if (!terms.length) return true;
      const hay = haystack(r);
      return terms.every((t) => hay.includes(t));
    });

    const dir = sortDesc ? -1 : 1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "at":
          return dir * ((a.fields.at ?? 0) - (b.fields.at ?? 0));
        case "ttl":
          return dir * (a.ttl - b.ttl);
        case "email":
          return dir * (a.fields.email ?? "").localeCompare(b.fields.email ?? "");
        case "type":
          return dir * a.type.localeCompare(b.type);
        default:
          return dir * a.key.localeCompare(b.key);
      }
    });
  }, [snapshot, query, type, activeOnly, sortKey, sortDesc]);

  const purchaseLocales = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of snapshot?.records || []) {
      if (record.type !== "purchase") continue;
      const locale = record.fields.locale || "unknown";
      counts.set(locale, (counts.get(locale) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [snapshot]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  function download() {
    const blob = new Blob([JSON.stringify(visible, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleanmysocial-records-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyMaster(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  }

  if (!token) {
    return (
      <div className="vault-gate">
        <h1>Vault</h1>
        <p className="vault-muted">
          Enter the admin token to read the record store.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setToken(tokenInput.trim());
          }}
        >
          <input
            className="vault-input"
            type="password"
            autoComplete="off"
            placeholder="ADMIN_TOKEN"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <button className="btn" type="submit" style={{ marginTop: 12 }}>
            Unlock
          </button>
        </form>
        {error && <p className="vault-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="vault">
      <div className="vault-head">
        <div>
          <h1>Vault</h1>
          <p className="vault-muted">
            {snapshot
              ? `${snapshot.total} record${snapshot.total === 1 ? "" : "s"} · read ${fmtDate(snapshot.fetchedAt)}`
              : loading
                ? "Loading…"
                : "No data"}
            {snapshot && !snapshot.storeConfigured && (
              <> · <strong>in-memory store (Redis not configured)</strong></>
            )}
          </p>
        </div>
        <div className="vault-actions">
          <a className="btn secondary" href="/crash">Product health</a>
          <button
            className="btn secondary"
            onClick={() => load(token)}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button className="btn secondary" onClick={download} disabled={!visible.length}>
            Export JSON
          </button>
          <button
            className="btn secondary"
            onClick={() => {
              window.localStorage.removeItem(TOKEN_STORAGE_KEY);
              setToken("");
              setSnapshot(null);
            }}
          >
            Lock
          </button>
        </div>
      </div>

      {snapshot?.masterAccess &&
      (snapshot.masterAccess.exactKey || snapshot.masterAccess.prefix) ? (
        <section className="vault-master" aria-labelledby="vault-master-title">
          <div className="vault-master-title">
            <span className="vault-master-icon" aria-hidden="true">◆</span>
            <div>
              <h2 id="vault-master-title">Master access</h2>
              <p>Server-side keys that unlock every CleanMySocial product forever.</p>
            </div>
          </div>
          <div className="vault-master-keys">
            {snapshot.masterAccess.exactKey ? (
              <div>
                <span>Exact key</span>
                <code>{snapshot.masterAccess.exactKey}</code>
                <button
                  type="button"
                  onClick={() => copyMaster("exact", snapshot.masterAccess!.exactKey!)}
                >
                  {copied === "exact" ? "Copied" : "Copy"}
                </button>
              </div>
            ) : null}
            {snapshot.masterAccess.prefix ? (
              <div>
                <span>Unique-key pattern</span>
                <code>{snapshot.masterAccess.prefix}&lt;unique-suffix&gt;</code>
                <button
                  type="button"
                  onClick={() => copyMaster("prefix", snapshot.masterAccess!.prefix!)}
                >
                  {copied === "prefix" ? "Copied" : "Copy prefix"}
                </button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {error && <p className="vault-error">{error}</p>}

      {purchaseLocales.length ? (
        <div className="vault-chips" aria-label="Paid purchases by product-page language">
          <strong>Paid by language</strong>
          {purchaseLocales.map(([locale, count]) => (
            <span className="vault-chip" key={locale}>{locale} <span className="vault-count">{count}</span></span>
          ))}
        </div>
      ) : null}

      <div className="vault-controls">
        <input
          className="vault-input"
          placeholder="Search key, email, plan, extension, raw JSON…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="vault-chips">
          {TYPES.map((t) => (
            <button
              key={t}
              className={`vault-chip${type === t ? " on" : ""}`}
              onClick={() => setType(t)}
            >
              {t}
              {snapshot && t !== "all" && (
                <span className="vault-count">{snapshot.counts[t]}</span>
              )}
            </button>
          ))}
          <button
            className={`vault-chip${activeOnly ? " on" : ""}`}
            onClick={() => setActiveOnly((v) => !v)}
          >
            active licenses only
          </button>
        </div>
      </div>

      <div className="vault-table-wrap">
        <table className="vault-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("type")}>Type</th>
              <th onClick={() => toggleSort("key")}>Key</th>
              <th onClick={() => toggleSort("email")}>Email</th>
              <th>Unlocks</th>
              <th>Plan</th>
              <th>Language</th>
              <th onClick={() => toggleSort("at")}>Updated</th>
              <th onClick={() => toggleSort("ttl")}>TTL</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <Fragment key={r.key}>
                <tr
                  className="vault-row"
                  onClick={() => setExpanded(expanded === r.key ? null : r.key)}
                >
                  <td>
                    <span className={`vault-tag t-${r.type}`}>{r.type}</span>
                  </td>
                  <td className="vault-mono">{r.fields.licenseKey ?? r.key}</td>
                  <td>{r.fields.email ?? "—"}</td>
                  <td>
                    {r.fields.entitlements.length ? (
                      <span className="vault-slugs">
                        {r.fields.entitlements.map((row) => (
                          <span
                            key={row.slug}
                            className={`vault-slug${row.active ? "" : " off"}`}
                            title={`${row.slug} — ${grantLine(row)}`}
                          >
                            {row.label}
                          </span>
                        ))}
                      </span>
                    ) : r.fields.activeSlugs.length ? (
                      <span className="vault-slugs">
                        {r.fields.activeSlugs.map((slug) => (
                          <span key={slug} className="vault-slug">
                            {slug}
                          </span>
                        ))}
                      </span>
                    ) : (
                      r.fields.extension ?? "—"
                    )}
                  </td>
                  <td>{r.fields.plan ?? "—"}</td>
                  <td>{r.fields.locale ?? "—"}</td>
                  <td>{fmtDate(r.fields.at)}</td>
                  <td>{fmtTtl(r.ttl)}</td>
                  <td>
                    {r.fields.status === null ? (
                      "—"
                    ) : (
                      <span className={statusClass(r.fields.status)}>
                        {STATUS_LABEL[r.fields.status]}
                        {r.fields.status === "partly-revoked" && (
                          <> ({r.fields.activeSlugs.length}/{r.fields.ownedSlugs.length})</>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
                {expanded === r.key && (
                  <tr>
                    <td colSpan={9}>
                      <div className="vault-detail">
                        <div className="vault-mono vault-muted">{r.key}</div>
                        {r.type === "license" && (
                          <div className="vault-grants">
                            <p className="vault-muted">
                              What each extension gets when it asks{" "}
                              <code>/api/license?extension=&lt;slug&gt;</code> with this
                              key
                              {r.fields.schema === "legacy" && (
                                <> · legacy record, treated as a full bundle</>
                              )}
                              {r.fields.products.length > 0 && (
                                <> · bought: {r.fields.products.join(", ")}</>
                              )}
                            </p>
                            {r.fields.entitlements.length ? (
                              <table className="vault-grant-table">
                                <tbody>
                                  {r.fields.entitlements.map((row) => (
                                    <tr key={row.slug}>
                                      <td>
                                        <span
                                          className={row.active ? "vault-ok" : "vault-bad"}
                                        >
                                          {row.active ? "unlocks" : "locked"}
                                        </span>
                                      </td>
                                      <td className="vault-mono">{row.slug}</td>
                                      <td className="vault-muted">{grantLine(row)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="vault-bad">
                                This key unlocks nothing — no entitlement was ever
                                granted on it.
                              </p>
                            )}
                          </div>
                        )}
                        <pre>{r.raw ?? "(empty)"}</pre>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!visible.length && !loading && (
              <tr>
                <td colSpan={8} className="vault-empty">
                  No matching records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="vault-muted vault-foot">
        Showing {visible.length} of {snapshot?.total ?? 0}. Click a row for the
        raw value.
      </p>
    </div>
  );
}
