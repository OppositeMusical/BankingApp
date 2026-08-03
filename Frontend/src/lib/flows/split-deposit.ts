/**
 * The splitting arithmetic. Spec: docs/flow-budgets.md §6 and §7.
 *
 * This is a pure function with no React, no I/O, and no dates. It is the single
 * definition of how a deposit is divided, and every invariant in the spec is
 * enforced here rather than in a screen.
 *
 * When the FastAPI backend exists this logic moves server-side behind
 * POST /flows/preview and this file becomes the reference implementation the
 * contract tests check against — two implementations of a rounding rule is two
 * rounding rules.
 */
import type { Money } from "@/lib/types/banking";
import type {
  Flow,
  FlowDestination,
  FlowRunLine,
  FlowSetAside,
  FlowSplit,
} from "@/lib/types/flows";

/** Destinations that can't currently receive money, and why. */
export type DestinationAvailability = {
  /** Frozen accounts still exist — their share is redirected to Rest. */
  frozenAccountIds?: string[];
  /** Closed or deleted destinations stop the Flow entirely. */
  missingAccountIds?: string[];
  missingGoalIds?: string[];
};

export type SplitResult =
  | { ok: true; lines: FlowRunLine[] }
  | { ok: false; reason: string };

const key = (destination: FlowDestination) =>
  destination.kind === "account"
    ? `account:${destination.accountId}`
    : `goal:${destination.goalId}`;

function isMissing(
  destination: FlowDestination,
  availability: DestinationAvailability,
) {
  return destination.kind === "account"
    ? (availability.missingAccountIds ?? []).includes(destination.accountId)
    : (availability.missingGoalIds ?? []).includes(destination.goalId);
}

function isFrozen(
  destination: FlowDestination,
  availability: DestinationAvailability,
) {
  return (
    destination.kind === "account" &&
    (availability.frozenAccountIds ?? []).includes(destination.accountId)
  );
}

/**
 * Splits one deposit according to a Flow's rules.
 *
 * Guarantees, asserted in the tests:
 *  - the sum of every line equals the deposit exactly, to the cent;
 *  - no line is ever negative;
 *  - the Rest split absorbs the rounding shortfall and any redirected share.
 */
export function splitDeposit(
  flow: Flow,
  deposit: Money,
  availability: DestinationAvailability = {},
): SplitResult {
  const remainderSplit = flow.splits.find((split) => split.isRemainder);

  // Structural preconditions. These are bugs, not user errors, so they fail
  // loudly rather than producing a plausible-looking wrong answer.
  if (!remainderSplit) {
    return { ok: false, reason: "This flow has no destination for the rest." };
  }
  if (flow.splits.filter((split) => split.isRemainder).length > 1) {
    return {
      ok: false,
      reason: "This flow has more than one destination for the rest.",
    };
  }
  if (totalPercentage(flow.splits) > 100) {
    return { ok: false, reason: "The shares add up to more than 100%." };
  }
  if (deposit.amount <= 0) {
    return { ok: false, reason: "There's nothing to split." };
  }

  // A destination that no longer exists stops the Flow — we will not silently
  // reroute someone's money somewhere they didn't choose.
  const allDestinations = [
    ...flow.setAsides.map((setAside) => setAside.destination),
    ...flow.splits.map((split) => split.destination),
  ];
  if (allDestinations.some((d) => isMissing(d, availability))) {
    return {
      ok: false,
      reason: "One of this flow's destinations no longer exists.",
    };
  }
  // Rest is the safety valve for every redirect, so it has to be usable for
  // the Flow to run at all.
  if (isFrozen(remainderSplit.destination, availability)) {
    return {
      ok: false,
      reason:
        "The account that receives the rest is frozen, so this flow can't run.",
    };
  }

  const currency = deposit.currency;
  const lines: FlowRunLine[] = [];
  let available = deposit.amount;
  let redirectedToRest = 0;

  // 1. Set-asides, in the order the user listed them.
  //
  // All-or-nothing: a set-aside that doesn't fit is skipped, and so is every
  // one after it. Funding a later, smaller set-aside would silently reorder
  // the user's stated priorities.
  let setAsidesStopped = false;
  for (const setAside of flow.setAsides) {
    if (setAsidesStopped || setAside.amount.amount > available) {
      setAsidesStopped = true;
      lines.push({
        splitId: setAside.id,
        destination: setAside.destination,
        amount: { amount: 0, currency },
        status: "skipped",
        note: "This deposit was smaller than usual, so this didn't happen. Nothing was overdrawn.",
      });
      continue;
    }

    if (isFrozen(setAside.destination, availability)) {
      // Frozen: the money still leaves the top of the deposit, but it goes to
      // Rest instead of a destination that can't accept it.
      available -= setAside.amount.amount;
      redirectedToRest += setAside.amount.amount;
      lines.push({
        splitId: setAside.id,
        destination: setAside.destination,
        amount: { amount: 0, currency },
        status: "redirected",
        note: "That account is frozen, so this went to the rest instead.",
      });
      continue;
    }

    available -= setAside.amount.amount;
    lines.push({
      splitId: setAside.id,
      destination: setAside.destination,
      amount: { amount: setAside.amount.amount, currency },
      status: "sent",
    });
  }

  // 2. Percentage splits over what's left, floored.
  const remaining = available;
  let distributed = 0;

  for (const split of flow.splits) {
    if (split.isRemainder) continue;

    const share = Math.floor((remaining * (split.percentage ?? 0)) / 100);
    distributed += share;

    if (isFrozen(split.destination, availability)) {
      redirectedToRest += share;
      lines.push({
        splitId: split.id,
        destination: split.destination,
        amount: { amount: 0, currency },
        status: "redirected",
        note: "That account is frozen, so this share went to the rest instead.",
      });
      continue;
    }

    lines.push({
      splitId: split.id,
      destination: split.destination,
      amount: { amount: share, currency },
      status: "sent",
    });
  }

  // 3. Rest takes what's left: its own share, the rounding shortfall, and
  //    anything redirected. This is what makes the total reconcile exactly.
  const rest = remaining - distributed + redirectedToRest;
  lines.push({
    splitId: remainderSplit.id,
    destination: remainderSplit.destination,
    amount: { amount: rest, currency },
    status: "sent",
    note:
      redirectedToRest > 0
        ? "Includes a share that couldn't reach its destination."
        : undefined,
  });

  return { ok: true, lines };
}

/** Sum of the user-set percentages. Rest is excluded — it's derived. */
export function totalPercentage(splits: FlowSplit[]): number {
  return splits
    .filter((split) => !split.isRemainder)
    .reduce((total, split) => total + (split.percentage ?? 0), 0);
}

/** What Rest currently receives, as a percentage. Never negative. */
export function remainderPercentage(splits: FlowSplit[]): number {
  return Math.max(0, 100 - totalPercentage(splits));
}

/** Total of the fixed set-asides, for display in the builder. */
export function totalSetAsides(
  setAsides: FlowSetAside[],
  currency: string,
): Money {
  return {
    amount: setAsides.reduce((total, item) => total + item.amount.amount, 0),
    currency,
  };
}

/** Convenience for previews: the line for one destination, or undefined. */
export function lineFor(lines: FlowRunLine[], destination: FlowDestination) {
  return lines.find((line) => key(line.destination) === key(destination));
}
