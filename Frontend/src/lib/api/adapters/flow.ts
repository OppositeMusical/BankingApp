import type {
  Flow,
  FlowSetAside,
  FlowSplit,
  FlowState,
} from "@/lib/types/flows";
import {
  DepositTriggerConfigSchema,
  InternalTransferActionConfigSchema,
  type WireRule,
} from "../wire";

/*
 * Flows ⇄ Rules.
 *
 * A Flow has no backend equivalent. What exists is `Rule`, and a Flow is a set
 * of rules that share one trigger:
 *
 *   Flow                     Rule[]
 *   ────                     ──────
 *   source (the payer)   →   triggerType: deposit_detected
 *                            triggerConfig: { merchantContains, minAmount }
 *   splits[]             →   one rule each, actionType: internal_transfer,
 *                            actionConfig: { toSubAccountId, percentOfTrigger }
 *   setAsides[]          →   same, but actionConfig: { amount }
 *   state                →   enabled
 *
 * Two things the contract cannot express, and how they are handled:
 *
 * 1. GROUPING. Nothing marks two rules as belonging to one Flow. They are
 *    grouped by (accountId + trigger fingerprint), and the Flow's name is
 *    recovered from a naming convention written on the way out — see
 *    `RULE_NAME_SEPARATOR`. Rules created outside this app still group
 *    correctly; they just fall back to the payer for a name.
 *
 * 2. "THE REST". `FlowSplit.isRemainder` is central to Flows — it is what
 *    absorbs the rounding remainder so a split sums to exactly what arrived
 *    (see lib/flows/split-deposit.ts) — and there is no field for it.
 *    `actionConfig` is an open object in the contract, so the marker below is
 *    round-tripped inside it. That is a bridge, not a design: it belongs in
 *    openapi.yaml as a first-class field. Logged in docs/api-contract.md.
 */

/** Written into `actionConfig` to carry `isRemainder` across the wire. */
export const REMAINDER_MARKER = "isRemainder";

/** Rules are named "<flow name> → <destination>" so the Flow name survives. */
export const RULE_NAME_SEPARATOR = " → ";

/** Rules that participate in a Flow at all. */
const isFlowRule = (rule: WireRule) =>
  rule.triggerType === "deposit_detected" &&
  rule.actionType === "internal_transfer";

/**
 * Identity of the deposit a set of rules reacts to. Two rules with the same
 * fingerprint are watching the same money arrive, which is what makes them one
 * Flow.
 */
function triggerFingerprint(rule: WireRule): string {
  const trigger = DepositTriggerConfigSchema.safeParse(rule.triggerConfig);
  const config = trigger.success ? trigger.data : {};
  return [
    rule.accountId,
    config.merchantContains ?? "",
    config.linkedAccountId ?? "",
    config.minAmount ?? "",
  ].join("|");
}

function flowNameFrom(rules: WireRule[], payer: string): string {
  const prefixes = rules
    .map((rule) => rule.name.split(RULE_NAME_SEPARATOR)[0]?.trim())
    .filter((prefix): prefix is string => Boolean(prefix));

  // Only trust the convention when every rule agrees; a single stray name
  // means these rules were not created by this app.
  const first = prefixes[0];
  if (first && prefixes.every((prefix) => prefix === first)) return first;
  return payer || "Flow";
}

function toState(rules: WireRule[]): FlowState {
  return rules.some((rule) => rule.enabled) ? "active" : "paused";
}

/** Groups a flat list of rules into the Flows they represent. */
export function toFlows(rules: WireRule[]): Flow[] {
  const groups = new Map<string, WireRule[]>();
  for (const rule of rules) {
    if (!isFlowRule(rule)) continue;
    const key = triggerFingerprint(rule);
    const existing = groups.get(key);
    if (existing) existing.push(rule);
    else groups.set(key, [rule]);
  }

  return [...groups.entries()].map(([key, groupRules]) =>
    toFlow(key, groupRules),
  );
}

function toFlow(key: string, rules: WireRule[]): Flow {
  const [first] = rules;
  const trigger = DepositTriggerConfigSchema.safeParse(first.triggerConfig);
  const triggerConfig = trigger.success ? trigger.data : {};
  const payer = triggerConfig.merchantContains ?? "";

  const splits: FlowSplit[] = [];
  const setAsides: FlowSetAside[] = [];

  for (const rule of rules) {
    const parsed = InternalTransferActionConfigSchema.safeParse(
      rule.actionConfig,
    );
    if (!parsed.success) continue;
    const action = parsed.data;

    const destinationId = action.toSubAccountId ?? action.toAccountId;
    if (!destinationId) continue;
    const destination = { kind: "account" as const, accountId: destinationId };

    // A fixed amount is taken off the top; a percentage is a split. The
    // contract allows either on the same action, so amount wins — it is the
    // more specific instruction.
    if (action.amount !== undefined) {
      setAsides.push({
        id: rule.id,
        destination,
        amount: { amount: action.amount, currency: "USD" },
        label: rule.name.split(RULE_NAME_SEPARATOR).pop()?.trim() ?? rule.name,
      });
      continue;
    }

    splits.push({
      id: rule.id,
      destination,
      percentage: action.percentOfTrigger,
      isRemainder: action[REMAINDER_MARKER] === true,
    });
  }

  return {
    id: `flow_${key.replace(/[^a-zA-Z0-9]/g, "_")}`,
    name: flowNameFrom(rules, payer),
    state: toState(rules),
    source: {
      id: `src_${first.accountId}`,
      displayName: payer || "A recurring deposit",
      matchPatterns: payer ? [payer] : [],
      arrivesInAccountId: first.accountId,
      // Cadence and typical amount are observations the contract does not
      // publish. `irregular` is the honest default — it makes no claim.
      cadence: "irregular",
      lastSeenAt: first.lastFiredAt ?? undefined,
    },
    setAsides,
    splits,
    createdAt: first.createdAt,
  };
}

/*
 * The write direction: one Flow becomes N CreateRule bodies.
 */

export type CreateRuleBody = {
  accountId: string;
  name: string;
  triggerType: "deposit_detected";
  triggerConfig: Record<string, unknown>;
  actionType: "internal_transfer";
  actionConfig: Record<string, unknown>;
  enabled: boolean;
};

export function toCreateRules(flow: Flow): CreateRuleBody[] {
  const triggerConfig: Record<string, unknown> = {};
  if (flow.source.matchPatterns[0]) {
    triggerConfig.merchantContains = flow.source.matchPatterns[0];
  }

  const enabled = flow.state === "active";
  const accountId = flow.source.arrivesInAccountId;

  const setAsideRules = flow.setAsides.map((setAside) => ({
    accountId,
    name: `${flow.name}${RULE_NAME_SEPARATOR}${setAside.label}`,
    triggerType: "deposit_detected" as const,
    triggerConfig,
    actionType: "internal_transfer" as const,
    actionConfig: {
      toSubAccountId: destinationId(setAside.destination),
      amount: setAside.amount.amount,
    },
    enabled,
  }));

  const splitRules = flow.splits.map((split) => ({
    accountId,
    name: `${flow.name}${RULE_NAME_SEPARATOR}${destinationId(split.destination)}`,
    triggerType: "deposit_detected" as const,
    triggerConfig,
    actionType: "internal_transfer" as const,
    actionConfig: {
      toSubAccountId: destinationId(split.destination),
      ...(split.percentage !== undefined
        ? { percentOfTrigger: split.percentage }
        : {}),
      ...(split.isRemainder ? { [REMAINDER_MARKER]: true } : {}),
    },
    enabled,
  }));

  // Set-asides first: they come off the top before any percentage applies.
  return [...setAsideRules, ...splitRules];
}

const destinationId = (destination: FlowSplit["destination"]) =>
  destination.kind === "account" ? destination.accountId : destination.goalId;
