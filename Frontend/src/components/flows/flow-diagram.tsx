import { Users } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { remainderPercentage } from "@/lib/flows/split-deposit";
import { resolveDestination } from "@/lib/flows/destinations";
import type { Money } from "@/lib/types/banking";
import type { FlowSplit } from "@/lib/types/flows";

/**
 * The splits of a Flow, drawn as a stitched list.
 *
 * The dashed thread is decorative; the content is a real <ul>, so the diagram
 * reads correctly when the visual is ignored. Rest is rendered last and shows a
 * derived percentage with no control — it moves as the others move.
 */
export function FlowDiagram({
  splits,
  typicalAmount,
  compact = false,
}: {
  splits: FlowSplit[];
  /** When present, each row also shows its share of a typical deposit. */
  typicalAmount?: Money;
  compact?: boolean;
}) {
  const rest = splits.find((split) => split.isRemainder);
  const shares = splits.filter((split) => !split.isRemainder);
  const restPercent = remainderPercentage(splits);

  const rows = [
    ...shares.map((split) => ({ split, percent: split.percentage ?? 0 })),
    ...(rest ? [{ split: rest, percent: restPercent }] : []),
  ];

  return (
    <ul className="relative flex flex-col gap-0">
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
          <li key={split.id} className="relative flex gap-3 pl-1">
            {/* Decorative thread: a dashed rule with a node where it meets
                the row. Hidden from assistive tech. */}
            <span
              className="relative flex w-3 shrink-0 justify-center"
              aria-hidden
            >
              <span
                className={`thread absolute top-0 ${isLast ? "h-1/2" : "h-full"}`}
              />
              <span className="thread-node absolute top-1/2 size-1.5 -translate-y-1/2" />
            </span>

            <div
              className={`flex min-w-0 flex-1 items-baseline justify-between gap-3 ${
                compact ? "py-1.5" : "py-2.5"
              }`}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm text-ink">
                  {destination.label}
                  {destination.isShared && (
                    <Users className="size-3.5 shrink-0 text-accent" aria-hidden />
                  )}
                </p>
                {!compact && (
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    {split.isRemainder
                      ? "Gets whatever's left"
                      : destination.detail}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-medium tabular text-ink">
                  {percent}%
                  {split.isRemainder && (
                    <span className="ml-1 font-normal text-ink-subtle">
                      (rest)
                    </span>
                  )}
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
  );
}
