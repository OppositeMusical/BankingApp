"use client";

import { useState } from "react";
import { formatMonthKey, formatMonthShort } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";
import type { MonthlyPoint } from "@/lib/types/banking";

/**
 * Money in vs money out over six months.
 *
 * Two series that must be told apart, so this is the one place a categorical
 * pair is warranted. Both series are money in USD and share a single y-axis —
 * never two scales. The pair was validated for lightness band, chroma floor,
 * CVD separation, normal-vision separation, and contrast against both the light
 * and dark chart surfaces; the dark steps are separately chosen, not flipped.
 */
/**
 * Picks a gridline interval that divides the range into roughly four steps and
 * lands on a round number (1, 2, 2.5, or 5 times a power of ten) — so the axis
 * reads $5,000 / $10,000 / $15,000 rather than $4,625 / $9,250 / $13,875.
 */
function niceStep(max: number) {
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const multiplier =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return multiplier * magnitude;
}

export function TrendChart({ data }: { data: MonthlyPoint[] }) {
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  const max = Math.max(
    ...data.flatMap((point) => [point.spent.amount, point.earned.amount]),
    1,
  );
  const step = niceStep(max);
  const axisTop = Math.ceil(max / step) * step;
  // Fractions of the axis top, so every gridline lands on a round figure.
  const gridLines = Array.from(
    { length: Math.round(axisTop / step) + 1 },
    (_, index) => (index * step) / axisTop,
  ).reverse();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Legend: always present for two or more series. */}
        <ul className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
          <li className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-[3px] bg-series-2"
              aria-hidden
            />
            Money in
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-[3px] bg-series-1"
              aria-hidden
            />
            Money out
          </li>
        </ul>
        <button
          type="button"
          onClick={() => setShowTable((current) => !current)}
          aria-pressed={showTable}
          className="rounded-field px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
        >
          {showTable ? "View as chart" : "View as table"}
        </button>
      </div>

      {showTable ? (
        <table className="w-full text-sm">
          <caption className="sr-only">
            Money in and money out by month
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-subtle">
              <th scope="col" className="pb-2 font-medium">
                Month
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Money in
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Money out
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((point) => (
              <tr key={point.month}>
                <th scope="row" className="py-2 font-normal text-ink">
                  {formatMonthKey(point.month)}
                </th>
                <td className="py-2 text-right tabular text-ink">
                  {formatMoney(point.earned, { compactWhole: true })}
                </td>
                <td className="py-2 text-right tabular text-ink">
                  {formatMoney(point.spent, { compactWhole: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          {/* Recessive gridlines, drawn behind the marks. */}
          <div className="absolute inset-x-0 top-0 h-48" aria-hidden>
            {gridLines.map((fraction) => (
              <div
                key={fraction}
                className="absolute inset-x-0 border-t border-chart-grid"
                style={{ top: `${(1 - fraction) * 100}%` }}
              >
                <span className="absolute -top-2 left-0 bg-surface pr-1.5 text-[10px] tabular text-ink-subtle">
                  {formatMoney(
                    { amount: axisTop * fraction, currency: "USD" },
                    { compactWhole: true },
                  )}
                </span>
              </div>
            ))}
          </div>

          <ul className="relative flex h-48 items-end gap-1.5 pl-12">
            {data.map((point) => {
              const isActive = activeMonth === point.month;
              return (
                <li
                  key={point.month}
                  className="relative flex h-full flex-1 items-end justify-center gap-[2px]"
                  onMouseEnter={() => setActiveMonth(point.month)}
                  onMouseLeave={() => setActiveMonth(null)}
                  onFocus={() => setActiveMonth(point.month)}
                  onBlur={() => setActiveMonth(null)}
                >
                  <button
                    type="button"
                    className="absolute inset-0 z-10 rounded-[4px]"
                    aria-label={`${formatMonthKey(point.month)}: ${formatMoney(
                      point.earned,
                      { compactWhole: true },
                    )} in, ${formatMoney(point.spent, {
                      compactWhole: true,
                    })} out`}
                  />
                  <Bar
                    heightPercent={(point.earned.amount / axisTop) * 100}
                    className="bg-series-2"
                    dimmed={activeMonth !== null && !isActive}
                  />
                  <Bar
                    heightPercent={(point.spent.amount / axisTop) * 100}
                    className="bg-series-1"
                    dimmed={activeMonth !== null && !isActive}
                  />

                  {isActive && (
                    <div
                      role="tooltip"
                      className="absolute bottom-full z-20 mb-2 w-max max-w-[11rem] -translate-x-0 rounded-field border border-border bg-surface px-3 py-2 text-xs shadow-float"
                    >
                      <p className="font-medium text-ink">
                        {formatMonthKey(point.month)}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-ink-muted">
                        <span
                          className="size-2 rounded-[2px] bg-series-2"
                          aria-hidden
                        />
                        In{" "}
                        <span className="tabular text-ink">
                          {formatMoney(point.earned, { compactWhole: true })}
                        </span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-ink-muted">
                        <span
                          className="size-2 rounded-[2px] bg-series-1"
                          aria-hidden
                        />
                        Out{" "}
                        <span className="tabular text-ink">
                          {formatMoney(point.spent, { compactWhole: true })}
                        </span>
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <ul className="mt-2 flex gap-1.5 pl-12">
            {data.map((point) => (
              <li
                key={point.month}
                className="flex-1 text-center text-[11px] text-ink-subtle"
              >
                {formatMonthShort(point.month)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Bar({
  heightPercent,
  className,
  dimmed,
}: {
  heightPercent: number;
  className: string;
  dimmed: boolean;
}) {
  return (
    <div
      className={`w-full max-w-6 rounded-t-[4px] transition-opacity duration-150 ${className} ${
        dimmed ? "opacity-45" : "opacity-100"
      }`}
      style={{ height: `${Math.max(heightPercent, 1)}%` }}
      aria-hidden
    />
  );
}
