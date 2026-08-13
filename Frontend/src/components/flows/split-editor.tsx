"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { formatMoney } from "@/lib/format/money";
import { remainderPercentage, totalPercentage } from "@/lib/flows/split-deposit";
import { resolveDestination } from "@/lib/flows/destinations";

// Accounts are real, passed down from the server. Goals were removed as a
// concept: the contract never had a goal resource — a SubAccount carries no
// target amount or date — so a goal destination could never round-trip.
import type { Account, Money } from "@/lib/types/banking";
import type { FlowDestination, FlowSplit } from "@/lib/types/flows";

const MIN_SHARE = 1;

const destinationKey = (destination: FlowDestination) =>
  destination.kind === "account"
    ? `account:${destination.accountId}`
    : `goal:${destination.goalId}`;

/**
 * Step 2 of the builder, and the most-used screen in the feature.
 *
 * Two rules govern everything here:
 *
 *  1. Dragging one share adjusts **Rest only** — never the other user-set
 *     shares. A slider that silently rebalances its neighbours makes the
 *     outcome impossible to predict.
 *  2. **Rest is derived.** It has no slider and no input; it displays what's
 *     left. This is why the total can never be wrong and why the user is never
 *     asked to make the last number fit.
 */
export function SplitEditor({
  splits,
  onChange,
  typicalAmount,
  accounts = [],
}: {
  splits: FlowSplit[];
  onChange: (splits: FlowSplit[]) => void;
  typicalAmount: Money;
  /** Real destinations, from the server. Empty in mock mode, where the
   *  goal fixtures below stand in. */
  accounts?: Account[];
}) {
  const [boundaryNote, setBoundaryNote] = useState<string | null>(null);

  const shares = splits.filter((split) => !split.isRemainder);
  const rest = splits.find((split) => split.isRemainder);
  const restPercent = remainderPercentage(splits);
  const used = totalPercentage(splits);

  const shareOf = (percent: number): Money => ({
    amount: Math.floor((typicalAmount.amount * percent) / 100),
    currency: typicalAmount.currency,
  });

  /** The most this split can take before Rest would go negative. */
  const maxFor = (splitId: string) => {
    const others = shares
      .filter((split) => split.id !== splitId)
      .reduce((total, split) => total + (split.percentage ?? 0), 0);
    return Math.max(MIN_SHARE, 100 - others);
  };

  const setPercentage = (splitId: string, requested: number) => {
    const max = maxFor(splitId);
    const clamped = Math.min(max, Math.max(MIN_SHARE, Math.round(requested)));

    if (requested > max) {
      setBoundaryNote(
        "That's everything that's left — the rest can't go below 0%.",
      );
    } else {
      setBoundaryNote(null);
    }

    onChange(
      splits.map((split) =>
        split.id === splitId ? { ...split, percentage: clamped } : split,
      ),
    );
  };

  const removeSplit = (splitId: string) => {
    setBoundaryNote(null);
    onChange(splits.filter((split) => split.id !== splitId));
  };

  const addSplit = (destination: FlowDestination) => {
    const available = Math.max(0, 100 - used);
    onChange([
      ...splits,
      {
        id: `spl_${Math.random().toString(36).slice(2, 9)}`,
        destination,
        percentage: Math.min(10, Math.max(MIN_SHARE, available)),
        isRemainder: false,
      },
    ]);
  };

  // Destinations not already spoken for.
  const availableDestinations = useMemo(() => {
    const takenKeys = new Set(splits.map((s) => destinationKey(s.destination)));
    const options: { label: string; destination: FlowDestination }[] = [
      ...accounts.map((account) => ({
        label: account.name,
        destination: { kind: "account" as const, accountId: account.id },
      })),
    ];
    return options.filter(
      (option) => !takenKeys.has(destinationKey(option.destination)),
    );
  }, [splits, accounts]);

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Of a typical deposit of{" "}
        <span className="font-medium text-ink">
          <Amount value={typicalAmount} />
        </span>
      </p>

      <ul className="mt-4 flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
        {shares.map((split) => {
          const destination = resolveDestination(split.destination);
          const percent = split.percentage ?? 0;
          const max = maxFor(split.id);
          const inputId = `share-${split.id}`;

          return (
            <li key={split.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <label
                    htmlFor={inputId}
                    className="flex items-center gap-1.5 text-sm font-medium text-ink"
                  >
                    {destination.label}
                    {destination.isShared && (
                      <Users className="size-3.5 text-accent" aria-hidden />
                    )}
                  </label>
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    {destination.detail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeSplit(split.id)}
                  className="-mr-1 -mt-1 inline-flex size-9 items-center justify-center rounded-field text-ink-subtle transition-colors hover:bg-surface-sunk hover:text-alert"
                >
                  <Trash2 className="size-4" aria-hidden />
                  <span className="sr-only">
                    Remove {destination.label} from this flow
                  </span>
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                {/*
                  The slider and the number input are peers, not a control and
                  a fallback: anyone who can't drag precisely gets the same
                  power, not a degraded version of it.
                */}
                <input
                  type="range"
                  min={MIN_SHARE}
                  max={100}
                  step={1}
                  value={percent}
                  onChange={(event) =>
                    setPercentage(split.id, Number(event.target.value))
                  }
                  aria-label={`${destination.label} share`}
                  aria-valuetext={`${percent} percent, about ${formatMoney(
                    shareOf(percent),
                    { compactWhole: true },
                  )}`}
                  className="h-11 flex-1 accent-[var(--accent)]"
                />
                <div className="flex shrink-0 items-center gap-1.5">
                  <input
                    id={inputId}
                    type="number"
                    inputMode="numeric"
                    min={MIN_SHARE}
                    max={max}
                    value={percent}
                    onChange={(event) =>
                      setPercentage(split.id, Number(event.target.value))
                    }
                    className="h-11 w-16 rounded-field border border-border-strong bg-surface px-2 text-center text-sm tabular text-ink"
                  />
                  <span className="text-sm text-ink-muted" aria-hidden>
                    %
                  </span>
                </div>
                <p className="w-24 shrink-0 text-right text-sm text-ink-muted">
                  ≈ <Amount value={shareOf(percent)} />
                </p>
              </div>
            </li>
          );
        })}

        {/* Rest: derived, no control. Always last. */}
        {rest && (
          <li className="bg-surface-sunk p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  {resolveDestination(rest.destination).label}
                  {resolveDestination(rest.destination).isShared && (
                    <Users className="size-3.5 text-accent" aria-hidden />
                  )}
                </p>
                <p className="mt-0.5 text-xs text-ink-subtle">
                  Gets whatever&apos;s left
                </p>
              </div>
              <div className="flex items-baseline gap-3 text-right">
                <p className="text-sm font-medium tabular text-ink">
                  {restPercent}%{" "}
                  <span className="font-normal text-ink-subtle">(rest)</span>
                </p>
                <p className="w-24 text-sm text-ink-muted">
                  ≈ <Amount value={shareOf(restPercent)} />
                </p>
              </div>
            </div>
          </li>
        )}
      </ul>

      {/* Adjusting one share moves Rest, so the change must be announced. */}
      <p aria-live="polite" className="sr-only">
        {`Shares total ${used} percent. The rest, ${restPercent} percent, goes to ${
          rest ? resolveDestination(rest.destination).label : "nowhere"
        }.`}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Total <span className="font-medium tabular text-ink">100%</span> ✓
        </p>
        <p className="text-xs text-ink-subtle">The rest adjusts itself</p>
      </div>

      {boundaryNote && (
        <p className="mt-2 text-sm text-ink-muted">{boundaryNote}</p>
      )}

      {availableDestinations.length > 0 && (
        <AddDestination
          options={availableDestinations}
          onAdd={addSplit}
        />
      )}
    </div>
  );
}

function AddDestination({
  options,
  onAdd,
}: {
  options: { label: string; destination: FlowDestination }[];
  onAdd: (destination: FlowDestination) => void;
}) {
  const [selected, setSelected] = useState(0);

  return (
    <div className="mt-4 flex flex-wrap items-end gap-2.5">
      <div className="flex-1">
        <label
          htmlFor="add-destination"
          className="block text-sm font-medium text-ink"
        >
          Add a destination
        </label>
        <select
          id="add-destination"
          value={selected}
          onChange={(event) => setSelected(Number(event.target.value))}
          className="mt-1.5 h-11 w-full rounded-field border border-border-strong bg-surface px-3 text-sm text-ink"
        >
          {options.map((option, index) => (
            <option key={option.label} value={index}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={() => {
          onAdd(options[selected].destination);
          setSelected(0);
        }}
        className="inline-flex h-11 items-center gap-2 rounded-field border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-sunk"
      >
        <Plus className="size-4" aria-hidden />
        Add
      </button>
    </div>
  );
}
