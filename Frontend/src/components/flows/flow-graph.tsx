import { Users } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { remainderPercentage } from "@/lib/flows/split-deposit";
import { resolveDestination } from "@/lib/flows/destinations";
import type { Money } from "@/lib/types/banking";
import type { FlowSplit } from "@/lib/types/flows";

/*
 * The splits of a Flow drawn as a branching diagram: a trunk leaving the
 * deposit, and one ribbon per destination, each ribbon as thick as its share.
 *
 * The drawing is a fixed-width SVG gutter beside each row rather than one
 * measured canvas. That keeps it deterministic — no layout effects, no resize
 * observer, identical markup on server and client — and it means the diagram
 * costs nothing to render many times over on the flows list. The full node
 * canvas (React Flow) stays where direct manipulation is the point: the
 * builder and the flow detail page.
 *
 * Row heights are fixed so the trunk lines up segment to segment. Thickness is
 * the only thing the drawing encodes, and every value it encodes is also
 * written out in the rows — which are a real <ul>. The SVG is decorative.
 */

/** Width of the connector column. */
const GUTTER = 44;
/** Where the trunk sits inside that column. */
const TRUNK_X = 11;
/** Fixed row heights, so consecutive trunk segments meet exactly. */
const ROW_COMPACT = 52;
const ROW_FULL = 66;
/** How far above the row's midpoint a branch leaves the trunk. */
const BRANCH_RISE = 18;

/**
 * Share as stroke width: 1.5px for a sliver, ~7px for the whole deposit. The
 * range is deliberately narrow — it should read as emphasis, not as a chart
 * anyone would try to measure.
 */
function ribbonWidth(percent: number) {
  const clamped = Math.min(100, Math.max(0, percent));
  return 1.5 + clamped * 0.055;
}

export function FlowGraph({
  splits,
  typicalAmount,
  sourceLabel = "Arrives",
  compact = false,
}: {
  splits: FlowSplit[];
  /** When present, each row also shows its share of a typical deposit. */
  typicalAmount?: Money;
  /** Heading on the node the trunk leaves from. */
  sourceLabel?: string;
  compact?: boolean;
}) {
  const rest = splits.find((split) => split.isRemainder);
  const shares = splits.filter((split) => !split.isRemainder);
  const restPercent = remainderPercentage(splits);

  // Rest is drawn last: it is always the thing money reaches after everything
  // else has taken its share.
  const rows = [
    ...shares.map((split) => ({ split, percent: split.percentage ?? 0 })),
    ...(rest ? [{ split: rest, percent: restPercent }] : []),
  ];

  const rowHeight = compact ? ROW_COMPACT : ROW_FULL;
  const mid = rowHeight / 2;

  return (
    <div>
      {/* The deposit the trunk descends from. */}
      <div className="flex items-baseline justify-between gap-3 rounded-field border border-paper-edge bg-surface-sunk/50 px-3 py-2">
        <span className="text-[10px] font-medium tracking-wide text-ink-subtle uppercase">
          {sourceLabel}
        </span>
        {typicalAmount && (
          <span className="font-numbers text-base font-semibold text-ink">
            <Amount value={typicalAmount} compactWhole />
          </span>
        )}
      </div>

      {/* Stem: joins the deposit to the first branch. */}
      <svg
        width={GUTTER}
        height={12}
        viewBox={`0 0 ${GUTTER} 12`}
        className="block"
        aria-hidden
      >
        <path
          d={`M ${TRUNK_X} 0 V 12`}
          fill="none"
          stroke="var(--thread)"
          strokeWidth={2}
          strokeDasharray="5 4"
        />
      </svg>

      <ul className="flex flex-col">
        {rows.map(({ split, percent }, index) => {
          const destination = resolveDestination(split.destination);
          const isLast = index === rows.length - 1;
          const share = typicalAmount
            ? {
                amount: Math.floor((typicalAmount.amount * percent) / 100),
                currency: typicalAmount.currency,
              }
            : undefined;

          return (
            <li key={split.id} className="flex items-stretch">
              <svg
                width={GUTTER}
                height={rowHeight}
                viewBox={`0 0 ${GUTTER} ${rowHeight}`}
                className="shrink-0"
                aria-hidden
              >
                {/* Trunk. Stops at the last branch — nothing continues past
                    the destination that takes what's left. */}
                <path
                  d={`M ${TRUNK_X} 0 V ${isLast ? mid : rowHeight}`}
                  fill="none"
                  stroke="var(--thread)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
                {/* Branch, as thick as its share. */}
                <path
                  d={`M ${TRUNK_X} ${mid - BRANCH_RISE} C ${TRUNK_X} ${mid}, ${
                    TRUNK_X + 12
                  } ${mid}, ${GUTTER} ${mid}`}
                  fill="none"
                  stroke={
                    split.isRemainder ? "var(--accent)" : "var(--thread)"
                  }
                  strokeWidth={ribbonWidth(percent)}
                  strokeLinecap="round"
                  opacity={split.isRemainder ? 0.6 : 0.95}
                />
              </svg>

              <div
                className="flex min-w-0 flex-1 items-center justify-between gap-3 border-b border-paper-edge/60"
                style={{ height: rowHeight }}
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm text-ink">
                    {destination.label}
                    {destination.isShared && (
                      <Users
                        className="size-3.5 shrink-0 text-accent"
                        aria-hidden
                      />
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-subtle">
                    {split.isRemainder
                      ? "Gets whatever's left"
                      : (destination.detail ?? "")}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium tabular text-ink">
                    {percent}%
                  </p>
                  {share && (
                    <p className="text-xs text-ink-muted">
                      ≈ <Amount value={share} />
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
