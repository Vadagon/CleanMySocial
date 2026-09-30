"use client";

import type { FunnelKpis, FunnelSnapshot, FunnelView as FunnelViewMode } from "@/lib/funnel";
import FunnelActivityChart from "./FunnelActivityChart";

function percent(ratio: number | null): number {
  return Math.round((ratio ?? 0) * 100);
}

/** Below this many in the denominator a rate is shown but not judged. */
const MIN_SAMPLE = 30;
/** A product is flagged when a KPI sits under this share of the suite's. */
const LOW_SHARE = 0.6;

function rate(value: number | null): string {
  return value === null ? "—" : `${percent(value)}%`;
}

function perClick(cents: number | null): string {
  return cents === null ? "—" : `$${(cents / 100).toFixed(2)}`;
}

function dollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

/**
 * One KPI in a table row: the value, the two counts it is made of, and a bar
 * scaled to the best row so products can be compared at a glance.
 */
function KpiCell({
  value,
  display,
  detail,
  sample,
  baseline,
  scale,
}: {
  value: number | null;
  display: string;
  detail: string;
  sample: number;
  baseline: number | null;
  scale: number;
}) {
  const thin = value !== null && sample < MIN_SAMPLE;
  const low = value !== null && !thin && baseline !== null && baseline > 0 && value < baseline * LOW_SHARE;
  return (
    <td className={low ? "kpi-cell kpi-cell--low" : thin ? "kpi-cell kpi-cell--thin" : "kpi-cell"}>
      <strong>{display}</strong>
      {low && <em>low</em>}
      {thin && <em>small sample</em>}
      <i className="funnel-step-track">
        <span style={{ width: `${value === null || scale <= 0 ? 0 : Math.max(2, Math.min(100, (value / scale) * 100))}%` }} />
      </i>
      <small>{detail}</small>
    </td>
  );
}

function installs(count: number): string {
  return `${count} install${count === 1 ? "" : "s"}`;
}

function kpiScale<T>(rows: T[], pick: (row: T) => number | null): number {
  return Math.max(0, ...rows.map((row) => pick(row) ?? 0));
}

export default function FunnelView({
  snapshot,
  dateRangeLabel,
  extension,
  view,
  onViewChange,
  version,
  onVersionChange,
  locale,
  onLocaleChange,
  onSelectExtension,
}: {
  snapshot: FunnelSnapshot;
  dateRangeLabel: string;
  extension: string;
  view: FunnelViewMode;
  onViewChange: (view: FunnelViewMode) => void;
  version: string;
  onVersionChange: (version: string) => void;
  locale: string;
  onLocaleChange: (locale: string) => void;
  onSelectExtension: (extension: string) => void;
}) {
  const reviewRate = snapshot.reviewClicks.eligible
    ? percent(snapshot.reviewClicks.users / snapshot.reviewClicks.eligible)
    : 0;
  const kpis: FunnelKpis = snapshot.kpis;
  // Judge a product against the suite only when the suite is actually in view.
  const suite = extension === "all" ? kpis : null;
  const products = snapshot.byExtension;
  const versions = snapshot.byVersion;

  return (
    <>
      <div className="vault-controls funnel-controls">
        <select value={view} onChange={(event) => onViewChange(event.target.value as FunnelViewMode)} aria-label="Funnel view">
          <option value="cohort">Install cohort</option>
          <option value="activity">Activity in period</option>
        </select>
        <select value={version} onChange={(event) => onVersionChange(event.target.value)} aria-label="Extension version filter">
          <option value="all">All versions</option>
          {snapshot.versions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={locale} onChange={(event) => onLocaleChange(event.target.value)} aria-label="UI locale filter">
          <option value="all">All locales</option>
          {snapshot.locales.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <p className="vault-muted funnel-note">
        {view === "cohort"
          ? `Install cohort: installations whose first run happened in ${dateRangeLabel.toLowerCase()}, followed to every later milestone.`
          : "Activity in period: milestones that occurred inside the range. Useful for volume, but not a strict funnel — an older installation can buy today."}
      </p>

      {snapshot.cohortIncomplete && view === "cohort" && (
        <p className="vault-muted funnel-warning">
          This cohort is still open. Installations from the last 7 days keep converting, so later steps will rise.
        </p>
      )}
      {snapshot.truncated && (
        <p className="vault-error">Showing the first 20,000 retained installations. Narrow the extension filter for exact totals.</p>
      )}
      {view === "cohort" && snapshot.withoutInstallEvent > 0 && (
        <p className="vault-muted funnel-warning">
          {snapshot.withoutInstallEvent} installation{snapshot.withoutInstallEvent === 1 ? " has" : "s have"} no
          {" "}<code>installed</code> event (installed before telemetry shipped, or the event never arrived) and cannot join a cohort.
        </p>
      )}

      <section className="feedback-kpis" aria-label="Key performance indicators">
        <div className="feedback-kpi">
          <span>Installations</span>
          <strong>{snapshot.installations}</strong>
          <div><small>{dateRangeLabel}</small></div>
        </div>
        <div className="feedback-kpi">
          <span>KPI 1 · Install → first success</span>
          <strong>{rate(kpis.activation)}</strong>
          <div><small>{kpis.firstSuccess} of {kpis.installations} installs</small></div>
        </div>
        <div className="feedback-kpi">
          <span>KPI 2 · First success → Get Pro</span>
          <strong>{rate(kpis.upgradeIntent)}</strong>
          <div><small>{kpis.proAfterSuccess} of {kpis.firstSuccess} activated installs</small></div>
        </div>
        <div className="feedback-kpi">
          <span>KPI 3 · Revenue per Get Pro click</span>
          <strong>{perClick(kpis.revenuePerProClick)}</strong>
          <div>
            <small>
              {snapshot.revenueComparable
                ? `${dollars(kpis.revenueCents)} · ${kpis.purchasesInPeriod} purchases ÷ ${kpis.proClicksInPeriod} clicks`
                : "Needs all versions and locales"}
            </small>
          </div>
        </div>
      </section>

      <section className="crash-panel funnel-panel" aria-labelledby="funnel-kpi-title">
        <div className="crash-panel-head">
          <h2 id="funnel-kpi-title">KPIs by extension</h2>
          <span>{dateRangeLabel}</span>
        </div>
        {products.length > 0 ? (
          <div className="vault-table-wrap kpi-table-wrap">
            <table className="kpi-table">
              <thead>
                <tr>
                  <th scope="col">Extension</th>
                  <th scope="col">KPI 1 · Install → first success</th>
                  <th scope="col">KPI 2 · First success → Get Pro</th>
                  <th scope="col">KPI 3 · Revenue per Get Pro click</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr key={item.extension}>
                    <th scope="row">
                      <button type="button" onClick={() => onSelectExtension(item.extension)}>
                        <strong>{item.name}</strong>
                        <small>{installs(item.installations)} · {item.capReached} hit the cap</small>
                      </button>
                    </th>
                    <KpiCell
                      value={item.activation}
                      display={rate(item.activation)}
                      detail={`${item.firstSuccess} of ${installs(item.installations)}`}
                      sample={item.installations}
                      baseline={suite?.activation ?? null}
                      scale={kpiScale(products, (row) => row.activation)}
                    />
                    <KpiCell
                      value={item.upgradeIntent}
                      display={rate(item.upgradeIntent)}
                      detail={`${item.proAfterSuccess} of ${item.firstSuccess} activated`}
                      sample={item.firstSuccess}
                      baseline={suite?.upgradeIntent ?? null}
                      scale={kpiScale(products, (row) => row.upgradeIntent)}
                    />
                    <KpiCell
                      value={item.revenuePerProClick}
                      display={perClick(item.revenuePerProClick)}
                      detail={snapshot.revenueComparable
                        ? `${dollars(item.revenueCents)} · ${item.purchasesInPeriod} purchases ÷ ${item.proClicksInPeriod} clicks`
                        : "Needs all versions and locales"}
                      sample={item.proClicksInPeriod}
                      baseline={suite?.revenuePerProClick ?? null}
                      scale={kpiScale(products, (row) => row.revenuePerProClick)}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="vault-muted">No funnel telemetry received yet.</p>
        )}
        <p className="vault-muted funnel-note">
          KPI 1 and 2 follow the {view === "cohort" ? "install cohort" : "period"} above. KPI 3 is always activity in the
          period: first-payment list price of purchases ÷ Get Pro clicks on the same days, counted from each
          product&apos;s first tracked click. Purchases are not joined to installations, so it is a ratio of two totals,
          not a per-user conversion. <em>low</em> marks a KPI under {Math.round(LOW_SHARE * 100)}% of the suite figure
          with at least {MIN_SAMPLE} in its denominator.
        </p>
      </section>

      {versions.length > 1 && (
        <section className="crash-panel funnel-panel" aria-labelledby="funnel-version-title">
          <div className="crash-panel-head">
            <h2 id="funnel-version-title">KPIs by install version</h2>
            <span>The version each installation first reported</span>
          </div>
          <div className="vault-table-wrap kpi-table-wrap">
            <table className="kpi-table">
              <thead>
                <tr>
                  <th scope="col">Version</th>
                  <th scope="col">KPI 1 · Install → first success</th>
                  <th scope="col">KPI 2 · First success → Get Pro</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((item) => (
                  <tr key={item.version}>
                    <th scope="row">
                      <span><strong>{item.version}</strong><small>{installs(item.installations)}</small></span>
                    </th>
                    <KpiCell
                      value={item.activation}
                      display={rate(item.activation)}
                      detail={`${item.firstSuccess} of ${installs(item.installations)}`}
                      sample={item.installations}
                      baseline={kpis.activation}
                      scale={kpiScale(versions, (row) => row.activation)}
                    />
                    <KpiCell
                      value={item.upgradeIntent}
                      display={rate(item.upgradeIntent)}
                      detail={`${item.proAfterSuccess} of ${item.firstSuccess} activated`}
                      sample={item.firstSuccess}
                      baseline={kpis.upgradeIntent}
                      scale={kpiScale(versions, (row) => row.upgradeIntent)}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="vault-muted funnel-note">
            A release that breaks the first action shows here first. Revenue is not split by version: a purchase does
            not record one.
          </p>
        </section>
      )}

      <FunnelActivityChart
        series={snapshot.dailyByEvent}
        catalog={snapshot.catalog}
        extension={extension}
        onSelectExtension={onSelectExtension}
        rangeLabel={dateRangeLabel}
      />

      <section className="crash-panel funnel-panel" aria-labelledby="funnel-steps-title">
        <div className="crash-panel-head">
          <h2 id="funnel-steps-title">Conversion funnel</h2>
          <span>{dateRangeLabel}</span>
        </div>
        <ol className="funnel-steps">
          {snapshot.steps.map((step) => (
            <li key={step.name} className={step.unattributed ? "funnel-step funnel-step--unattributed" : "funnel-step"}>
              <div className="funnel-step-head">
                <span className="funnel-step-index">{step.step}</span>
                <strong>{step.label}</strong>
                <span className="funnel-step-users">{step.users}</span>
              </div>
              {step.conversionFromInstall !== null && (
                <i className="funnel-step-track">
                  <span style={{ width: `${Math.max(1, Math.min(100, percent(step.conversionFromInstall)))}%` }} />
                </i>
              )}
              <div className="funnel-step-meta">
                {step.conversionFromInstall === null
                  ? <span>Not comparable to the steps above</span>
                  : <>
                      <span>{percent(step.conversionFromInstall)}% of installs</span>
                      <span>{step.step === 1 ? "—" : `${percent(step.conversionFromPrevious)}% from previous`}</span>
                      <span>{step.step === 1 || step.dropOff === null ? "" : `${step.dropOff} dropped off`}</span>
                    </>}
              </div>
              {step.unattributed && (
                <p className="funnel-step-caveat">
                  Verified website fulfillments in this period, counted across every installation — tracked or not.
                  There is no attribution token yet, so this is a website total beside the funnel rather than a
                  conversion of the installations above, and it is left out of the average.
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {snapshot.activation.length > 0 && (
        <section className="crash-panel funnel-panel" aria-labelledby="funnel-activation-title">
          <div className="crash-panel-head">
            <h2 id="funnel-activation-title">Activation</h2>
            <span>Between install and first action</span>
          </div>
          <ol className="funnel-steps">
            {snapshot.activation.map((row) => (
              <li key={row.name} className="funnel-step">
                <div className="funnel-step-head">
                  <span className="funnel-step-index">·</span>
                  <strong>{row.label}</strong>
                  <span className="funnel-step-users">{row.users}</span>
                </div>
                <i className="funnel-step-track">
                  <span style={{ width: `${Math.max(1, Math.min(100, percent(row.conversionFromInstall)))}%` }} />
                </i>
                <div className="funnel-step-meta">
                  <span>{percent(row.conversionFromInstall)}% of installs</span>
                </div>
              </li>
            ))}
          </ol>
          <p className="vault-muted funnel-note">
            Only extensions that report these steps appear here. Each is a share of installs, not of the row above:
            “Had to sign in first” is a detour, not a stage.
          </p>
        </section>
      )}

      <section className="crash-panel funnel-panel" aria-labelledby="funnel-review-title">
        <div className="crash-panel-head">
          <h2 id="funnel-review-title">Review link clicks</h2>
          <span>Outside the ordered funnel</span>
        </div>
        <p className="funnel-review">
          <strong>{snapshot.reviewClicks.users}</strong> of {snapshot.reviewClicks.eligible} installations that completed a
          first action opened the store review page ({reviewRate}%). A click means the review page was opened — never that a
          review was submitted.
        </p>
      </section>
    </>
  );
}
