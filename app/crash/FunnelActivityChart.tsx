"use client";

import { useMemo, useRef, useState } from "react";
import type { FunnelCatalogEntry, FunnelDailySeries } from "@/lib/funnel";

/**
 * Daily milestone activity: one line per event, a product picker beside it, and
 * a legend that switches lines on and off.
 *
 * Colour comes from the fixed categorical order in globals.css (--viz-1..6),
 * keyed to `series.slot` rather than to the series' position in the visible
 * list — so hiding a line never repaints the survivors.
 */

const VIEW_WIDTH = 760;
const VIEW_HEIGHT = 280;
const PADDING = { top: 18, right: 20, bottom: 34, left: 42 };
const PLOT_WIDTH = VIEW_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = VIEW_HEIGHT - PADDING.top - PADDING.bottom;

function shortDay(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Axis ticks a reader recognises: 1/2/5 × 10ⁿ, never 7 or 23. */
function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= rough) ?? magnitude * 10;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step / 2; value += step) ticks.push(Math.round(value));
  return ticks;
}

export default function FunnelActivityChart({
  series,
  catalog,
  extension,
  onSelectExtension,
  rangeLabel,
}: {
  series: FunnelDailySeries[];
  catalog: FunnelCatalogEntry[];
  extension: string;
  onSelectExtension: (extension: string) => void;
  rangeLabel: string;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [showTable, setShowTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const plotRef = useRef<SVGRectElement>(null);

  const days = series[0]?.points.map((point) => point.day) ?? [];
  const visible = useMemo(() => series.filter((item) => !hidden.has(item.name)), [series, hidden]);
  const max = useMemo(
    () => Math.max(1, ...visible.flatMap((item) => item.points.map((point) => point.count))),
    [visible],
  );
  const ticks = useMemo(() => niceTicks(max), [max]);
  const top = ticks[ticks.length - 1];

  const x = (index: number) => days.length <= 1
    ? PADDING.left + PLOT_WIDTH / 2
    : PADDING.left + (index / (days.length - 1)) * PLOT_WIDTH;
  const y = (value: number) => PADDING.top + PLOT_HEIGHT - (value / top) * PLOT_HEIGHT;

  function toggle(name: string) {
    setHidden((current) => {
      const next = new Set(current);
      // Never let the reader empty the chart: the last visible line stays.
      if (next.has(name)) next.delete(name);
      else if (series.length - next.size > 1) next.add(name);
      return next;
    });
  }

  // Both handlers are wired below: pointer events cover touch and pen, and the
  // mouse pair keeps the crosshair working where pointer events never arrive.
  function trackPointer(event: { clientX: number }) {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || !days.length) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    // The crosshair snaps to the nearest day; nobody has to hit a 2px line.
    setHover(Math.max(0, Math.min(days.length - 1, Math.round(ratio * (days.length - 1)))));
  }

  // Label every other tick when the range is long enough to collide.
  const labelEvery = days.length > 16 ? Math.ceil(days.length / 8) : days.length > 8 ? 2 : 1;

  return (
    <section className="crash-panel funnel-activity" aria-labelledby="funnel-activity-title">
      <div className="crash-panel-head">
        <div>
          <h2 id="funnel-activity-title">Events per day</h2>
          <p>Milestones counted on the day they happened, across every tracked installation</p>
        </div>
        <span>{rangeLabel}</span>
      </div>

      <div className="funnel-activity-body">
        <div className="funnel-picker" role="group" aria-label="Extension">
          <button
            type="button"
            className={extension === "all" ? "active" : ""}
            aria-pressed={extension === "all"}
            onClick={() => onSelectExtension("all")}
          >
            <span className="funnel-picker-all" aria-hidden="true">◧</span>
            <span className="funnel-picker-text">
              <strong>All extensions</strong>
              <small>{catalog.reduce((sum, item) => sum + item.installations, 0)} tracked</small>
            </span>
          </button>
          {catalog.map((item) => (
            <button
              key={item.extension}
              type="button"
              className={extension === item.extension ? "active" : ""}
              aria-pressed={extension === item.extension}
              onClick={() => onSelectExtension(item.extension)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.icon} alt="" width={26} height={26} loading="lazy" />
              <span className="funnel-picker-text">
                <strong>{item.name}</strong>
                <small>{item.installations ? `${item.installations} tracked` : "no telemetry yet"}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="funnel-chart-area">
          <div className="funnel-chart-frame">
            <svg
              viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
              role="img"
              aria-label={`Daily milestone counts for ${rangeLabel}`}
              onPointerLeave={() => setHover(null)}
              onMouseLeave={() => setHover(null)}
            >
              {ticks.map((tick) => (
                <g key={tick}>
                  <line
                    className="funnel-grid"
                    x1={PADDING.left} x2={PADDING.left + PLOT_WIDTH}
                    y1={y(tick)} y2={y(tick)}
                  />
                  <text className="funnel-axis-text" x={PADDING.left - 8} y={y(tick) + 4} textAnchor="end">{tick}</text>
                </g>
              ))}

              {days.map((day, index) => (
                index % labelEvery === 0 && (
                  <text
                    key={day}
                    className="funnel-axis-text"
                    x={x(index)}
                    y={VIEW_HEIGHT - 12}
                    textAnchor={index === 0 ? "start" : index === days.length - 1 ? "end" : "middle"}
                  >{shortDay(day)}</text>
                )
              ))}

              {hover !== null && (
                <line
                  className="funnel-crosshair"
                  x1={x(hover)} x2={x(hover)}
                  y1={PADDING.top} y2={PADDING.top + PLOT_HEIGHT}
                />
              )}

              {visible.map((item) => (
                <g key={item.name} className={`funnel-line funnel-line--${item.slot + 1}`}>
                  <path
                    d={item.points.map((point, index) => `${index ? "L" : "M"}${x(index)} ${y(point.count)}`).join(" ")}
                    fill="none"
                  />
                  {item.points.map((point, index) => (
                    <circle
                      key={point.day}
                      cx={x(index)}
                      cy={y(point.count)}
                      r={hover === index ? 5 : 4}
                    />
                  ))}
                </g>
              ))}

              <rect
                ref={plotRef}
                x={PADDING.left} y={PADDING.top}
                width={PLOT_WIDTH} height={PLOT_HEIGHT}
                fill="transparent"
                onPointerMove={trackPointer}
                onMouseMove={trackPointer}
              />
            </svg>

            {hover !== null && (
              <div
                className={`funnel-tooltip${hover > days.length / 2 ? " funnel-tooltip--left" : ""}`}
                style={{ left: `${(x(hover) / VIEW_WIDTH) * 100}%` }}
              >
                <strong>{shortDay(days[hover])}</strong>
                {visible.map((item) => (
                  <span key={item.name}>
                    <i className={`funnel-key funnel-key--${item.slot + 1}`} aria-hidden="true" />
                    <b>{item.points[hover]?.count ?? 0}</b>
                    <em>{item.label}</em>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="funnel-legend" role="group" aria-label="Milestones shown">
            {series.map((item) => {
              const on = !hidden.has(item.name);
              return (
                <button
                  key={item.name}
                  type="button"
                  className={on ? `funnel-legend-item funnel-legend-item--${item.slot + 1}` : `funnel-legend-item funnel-legend-item--${item.slot + 1} off`}
                  aria-pressed={on}
                  onClick={() => toggle(item.name)}
                >
                  <i aria-hidden="true" />
                  <span>{item.label}</span>
                  <small>{item.total}</small>
                </button>
              );
            })}
            <button type="button" className="funnel-table-toggle" aria-expanded={showTable} onClick={() => setShowTable(!showTable)}>
              {showTable ? "Hide table" : "Show table"}
            </button>
          </div>

          {showTable && (
            <div className="vault-table-wrap funnel-table-wrap">
              <table className="vault-table">
                <thead>
                  <tr><th>Day</th>{series.map((item) => <th key={item.name}>{item.label}</th>)}</tr>
                </thead>
                <tbody>
                  {days.map((day, index) => (
                    <tr key={day}>
                      <td>{shortDay(day)}</td>
                      {series.map((item) => <td key={item.name}>{item.points[index]?.count ?? 0}</td>)}
                    </tr>
                  ))}
                  {!days.length && <tr><td colSpan={series.length + 1} className="vault-empty">No events in this range.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
