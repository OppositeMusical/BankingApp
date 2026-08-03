"use client";

import { useState } from "react";
import { categoryLabels } from "@/components/banking/transaction-row";
import { Amount } from "@/components/banking/amount";
import { formatMoney } from "@/lib/format/money";
import type { SpendingSlice } from "@/lib/types/banking";
import { cn } from "@/lib/utils/cn";

/**
 * Spending by category: the job is comparing magnitude, so this is a sorted
 * horizontal bar chart in a single hue — not eight competing colors. Identity
 * is carried by the axis label next to each bar, which means color never has to
 * do that work and the chart stays readable under any form of color blindness.
 */
export function CategoryBars({ data }: { data: SpendingSlice[] }) {
  const [showTable, setShowTable] = useState(false);
  const sorted = [...data].sort((a, b) => b.total.amount - a.total.amount);
  const max = Math.max(...sorted.map((slice) => slice.total.amount), 1);
  const total = sorted.reduce((sum, slice) => sum + slice.total.amount, 0);

  return (
    <div>
      <div className="mb-4 flex justify-end">
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
          <caption className="sr-only">Spending by category this month</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-subtle">
              <th scope="col" className="pb-2 font-medium">
                Category
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Amount
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Share
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((slice) => (
              <tr key={slice.category}>
                <th scope="row" className="py-2 font-normal text-ink">
                  {categoryLabels[slice.category]}
                </th>
                <td className="py-2 text-right tabular text-ink">
                  {formatMoney(slice.total)}
                </td>
                <td className="py-2 text-right tabular text-ink-muted">
                  {Math.round((slice.total.amount / total) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {sorted.map((slice) => {
            const width = (slice.total.amount / max) * 100;
            return (
              <li key={slice.category} className="group">
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-ink">
                    {categoryLabels[slice.category]}
                  </span>
                  {/* Direct label — no tooltip needed to read the value. */}
                  <span className="tabular text-ink-muted">
                    <Amount value={slice.total} compactWhole />
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-[4px] bg-chart-track">
                  <div
                    className={cn(
                      "h-full rounded-[4px] bg-series-1",
                      "transition-[width] duration-500 ease-[var(--ease-out)]",
                    )}
                    style={{ width: `${Math.max(width, 1.5)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
