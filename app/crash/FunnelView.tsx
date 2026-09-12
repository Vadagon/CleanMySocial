"use client";

import type { FunnelSnapshot, FunnelView as FunnelViewMode } from "@/lib/funnel";
import FunnelActivityChart from "./FunnelActivityChart";

function percent(ratio: number | null): number {
  return Math.round((ratio ?? 0) * 100);
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
  const firstSuccess = snapshot.steps.find((step) => step.name === "first_action_succeeded");
  const getPro = snapshot.steps.find((step) => step.name === "get_pro_clicked");

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

      <section className="feedback-kpis" aria-label="Funnel signals">
        <div className="feedback-kpi">
          <span>Installations</span>
          <strong>{snapshot.installations}</strong>
          <div><small>{dateRangeLabel}</small></div>
        </div>
        <div className="feedback-kpi">
          <span>Reached first success</span>
          <strong>{percent(firstSuccess?.conversionFromInstall ?? 0)}%</strong>
          <div><small>{firstSuccess?.users ?? 0} installations completed a cleanup</small></div>
        </div>
        <div className="feedback-kpi">
          <span>Get Pro clicked</span>
          <strong>{percent(getPro?.conversionFromInstall ?? 0)}%</strong>
          <div><small>{getPro?.users ?? 0} opened the product page</small></div>
        </div>
        <div className="feedback-kpi">
          <span>Average steps completed</span>
          <strong>{snapshot.averageStepsCompleted.toFixed(2)}</strong>
          <div><small>of {snapshot.averageStepsBasis} tracked steps · purchases are not attributed</small></div>
        </div>
      </section>

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

      <div className="crash-overview funnel-overview">
        <section className="crash-panel" aria-labelledby="funnel-products-title">
          <div className="crash-panel-head"><h2 id="funnel-products-title">By extension</h2></div>
          <div className="crash-product-list">
            {snapshot.byExtension.map((item) => (
              <button key={item.extension} type="button" onClick={() => onSelectExtension(item.extension)}>
                <span><strong>{item.name}</strong><small>{item.firstSuccess} first success · {item.capReached} hit the cap</small></span>
                <span><strong>{item.installations}</strong><small>{item.proClicked} Get Pro · {item.fulfillments} purchases</small></span>
              </button>
            ))}
            {!snapshot.byExtension.length && <p className="vault-muted">No funnel telemetry received yet.</p>}
          </div>
        </section>
      </div>

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
