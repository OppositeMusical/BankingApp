/**
 * Types for Flows — the flow-based budgeting system.
 * Spec: docs/flow-budgets.md
 *
 * Same wire conventions as the rest of the app: camelCase, ISO-8601 UTC,
 * money as integer minor units.
 */
import type { Money } from "./banking";

export type FlowState = "draft" | "active" | "paused" | "needs-attention";

export type FlowCadence = "weekly" | "biweekly" | "monthly" | "irregular";

export type FlowSource = {
  id: string;
  /** Cleaned-up payer name shown to the user. */
  displayName: string;
  /** Raw descriptors used to match incoming credits. */
  matchPatterns: string[];
  /** Account the deposit lands in. */
  arrivesInAccountId: string;
  cadence: FlowCadence;
  /** Median of observed deposits — for previews only, never for arithmetic. */
  typicalAmount?: Money;
  lastSeenAt?: string;
};

export type FlowDestination =
  | { kind: "account"; accountId: string }
  | { kind: "goal"; goalId: string };

export type FlowSplit = {
  id: string;
  destination: FlowDestination;
  /** Percentage of the post-set-aside remainder. Absent on the Rest split. */
  percentage?: number;
  /** Exactly one split per Flow. Absorbs the remainder and the odd cents. */
  isRemainder: boolean;
};

export type FlowSetAside = {
  id: string;
  destination: FlowDestination;
  /** Fixed amount taken off the top, before percentages. */
  amount: Money;
  label: string;
};

export type Flow = {
  id: string;
  name: string;
  state: FlowState;
  source: FlowSource;
  setAsides: FlowSetAside[];
  splits: FlowSplit[];
  createdAt: string;
  lastRunAt?: string;
  /** Present only in needs-attention; plain-language description of the fix. */
  attentionReason?: string;
};

export type FlowRunLineStatus = "sent" | "skipped" | "redirected";

export type FlowRunLine = {
  /** Split or set-aside this line came from. */
  splitId: string;
  destination: FlowDestination;
  /** What actually moved. Zero for skipped and redirected lines. */
  amount: Money;
  status: FlowRunLineStatus;
  /** Why it was skipped or redirected — shown verbatim to the user. */
  note?: string;
};

export type FlowRun = {
  id: string;
  flowId: string;
  transactionId: string;
  depositAmount: Money;
  occurredAt: string;
  lines: FlowRunLine[];
  reversedAt?: string;
};

/**
 * A recurring credit we detected but that isn't yet attached to a Flow.
 * Powers step 1 of the builder.
 */
export type FlowSourceSuggestion = {
  id: string;
  displayName: string;
  matchPatterns: string[];
  arrivesInAccountId: string;
  cadence: FlowCadence;
  typicalAmount: Money;
  /** Most recent deposits, newest first — so the user recognises the payer. */
  recentAmounts: Money[];
  lastSeenAt: string;
  /** Total received over the lookback window; drives sort order. */
  totalReceived: Money;
  /** True when a Flow already claims this payer. */
  alreadyUsed?: boolean;
};
