import { accounts, goals } from "@/lib/mock/data";
import type { FlowDestination } from "@/lib/types/flows";

export type ResolvedDestination = {
  label: string;
  /** Short context line: "Goal · 71% funded", "Shared with Daniel O." */
  detail?: string;
  kind: "account" | "goal";
  /** True when someone other than the owner can see money that lands here. */
  isShared: boolean;
  /** Names of the other people who can see it. */
  sharedWith: string[];
  exists: boolean;
};

/**
 * Turns a FlowDestination into something displayable.
 *
 * Sharing is resolved here rather than at each call site so that every screen
 * showing a destination shows the same warning — routing money into a shared
 * account is a visibility event, and the user should never have to go looking
 * for that fact.
 */
export function resolveDestination(
  destination: FlowDestination,
): ResolvedDestination {
  if (destination.kind === "account") {
    const account = accounts.find((a) => a.id === destination.accountId);
    if (!account) {
      return {
        label: "Account no longer available",
        kind: "account",
        isShared: false,
        sharedWith: [],
        exists: false,
      };
    }
    const sharedWith = account.sharedWith.map((share) => share.name);
    return {
      label: account.name,
      detail:
        sharedWith.length > 0
          ? `Shared with ${sharedWith.join(", ")}`
          : `···· ${account.last4}`,
      kind: "account",
      isShared: sharedWith.length > 0,
      sharedWith,
      exists: true,
    };
  }

  const goal = goals.find((g) => g.id === destination.goalId);
  if (!goal) {
    return {
      label: "Goal no longer available",
      kind: "goal",
      isShared: false,
      sharedWith: [],
      exists: false,
    };
  }
  const percent = Math.round((goal.saved.amount / goal.target.amount) * 100);
  return {
    label: goal.name,
    detail: `Goal · ${percent}% funded`,
    kind: "goal",
    isShared: false,
    sharedWith: [],
    exists: true,
  };
}

/** Every distinct person who can see money routed by this set of destinations. */
export function sharedViewers(destinations: FlowDestination[]): string[] {
  const names = new Set<string>();
  for (const destination of destinations) {
    for (const name of resolveDestination(destination).sharedWith) {
      names.add(name);
    }
  }
  return [...names];
}

const cadenceWords: Record<string, string> = {
  weekly: "about every week",
  biweekly: "about every 2 weeks",
  monthly: "monthly",
  irregular: "irregularly",
};

export const describeCadence = (cadence: string) =>
  cadenceWords[cadence] ?? cadence;
