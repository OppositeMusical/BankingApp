import { describe, expect, it } from "vitest";
import {
  REMAINDER_MARKER,
  RULE_NAME_SEPARATOR,
  toCreateRules,
  toFlows,
} from "./flow";
import type { WireRule } from "../wire";
import type { Flow } from "@/lib/types/flows";

const rule = (overrides: Partial<WireRule> = {}): WireRule => ({
  id: "rule_1",
  accountId: "acc_1",
  name: "Payday → sub_safety",
  triggerType: "deposit_detected",
  triggerConfig: { merchantContains: "Northwind" },
  actionType: "internal_transfer",
  actionConfig: { toSubAccountId: "sub_safety", percentOfTrigger: 20 },
  enabled: true,
  createdAt: "2026-08-01T00:00:00Z",
  ...overrides,
});

describe("toFlows", () => {
  it("groups rules that watch the same deposit into one flow", () => {
    const flows = toFlows([
      rule({ id: "r1", actionConfig: { toSubAccountId: "a", percentOfTrigger: 20 } }),
      rule({ id: "r2", actionConfig: { toSubAccountId: "b", percentOfTrigger: 25 } }),
    ]);

    expect(flows).toHaveLength(1);
    expect(flows[0].splits).toHaveLength(2);
  });

  it("separates rules watching different payers", () => {
    const flows = toFlows([
      rule({ id: "r1", triggerConfig: { merchantContains: "Northwind" } }),
      rule({ id: "r2", triggerConfig: { merchantContains: "Two Rivers" } }),
    ]);

    expect(flows).toHaveLength(2);
  });

  it("ignores rules that are not deposit-driven internal transfers", () => {
    const flows = toFlows([
      rule({ id: "r1" }),
      rule({ id: "r2", triggerType: "schedule" }),
      rule({ id: "r3", actionType: "notify" }),
    ]);

    expect(flows).toHaveLength(1);
    expect(flows[0].splits).toHaveLength(1);
  });

  it("recovers the flow name from the rule naming convention", () => {
    const flows = toFlows([
      rule({ id: "r1", name: `Salary split${RULE_NAME_SEPARATOR}a` }),
      rule({ id: "r2", name: `Salary split${RULE_NAME_SEPARATOR}b` }),
    ]);

    expect(flows[0].name).toBe("Salary split");
  });

  it("falls back to the payer when rule names disagree", () => {
    const flows = toFlows([
      rule({ id: "r1", name: "Something else" }),
      rule({ id: "r2", name: "Unrelated name" }),
    ]);

    expect(flows[0].name).toBe("Northwind");
  });

  it("reads the remainder marker out of actionConfig", () => {
    const flows = toFlows([
      rule({ id: "r1", actionConfig: { toSubAccountId: "a", percentOfTrigger: 20 } }),
      rule({
        id: "r2",
        actionConfig: { toSubAccountId: "b", [REMAINDER_MARKER]: true },
      }),
    ]);

    const remainder = flows[0].splits.filter((split) => split.isRemainder);
    expect(remainder).toHaveLength(1);
    expect(remainder[0].id).toBe("r2");
  });

  it("treats a fixed amount as a set-aside, not a split", () => {
    const flows = toFlows([
      rule({ id: "r1", actionConfig: { toSubAccountId: "a", amount: 25_000 } }),
      rule({ id: "r2", actionConfig: { toSubAccountId: "b", percentOfTrigger: 20 } }),
    ]);

    expect(flows[0].setAsides).toHaveLength(1);
    expect(flows[0].setAsides[0].amount.amount).toBe(25_000);
    expect(flows[0].splits).toHaveLength(1);
  });

  it("is paused only when every rule is disabled", () => {
    expect(
      toFlows([rule({ id: "r1", enabled: false }), rule({ id: "r2", enabled: true })])[0]
        .state,
    ).toBe("active");
    expect(
      toFlows([rule({ id: "r1", enabled: false }), rule({ id: "r2", enabled: false })])[0]
        .state,
    ).toBe("paused");
  });
});

describe("toCreateRules", () => {
  const flow: Flow = {
    id: "flow_1",
    name: "Payday",
    state: "active",
    source: {
      id: "src_1",
      displayName: "Northwind",
      matchPatterns: ["Northwind"],
      arrivesInAccountId: "acc_1",
      cadence: "monthly",
    },
    setAsides: [
      {
        id: "sa_1",
        destination: { kind: "account", accountId: "sub_rent" },
        amount: { amount: 120_000, currency: "USD" },
        label: "Rent",
      },
    ],
    splits: [
      {
        id: "sp_1",
        destination: { kind: "account", accountId: "sub_safety" },
        percentage: 20,
        isRemainder: false,
      },
      {
        id: "sp_2",
        destination: { kind: "account", accountId: "sub_everyday" },
        isRemainder: true,
      },
    ],
    createdAt: "2026-08-01T00:00:00Z",
  };

  it("puts set-asides before splits, since they come off the top", () => {
    const bodies = toCreateRules(flow);
    expect(bodies[0].actionConfig.amount).toBe(120_000);
    expect(bodies[1].actionConfig.percentOfTrigger).toBe(20);
  });

  it("carries the remainder marker so the rest survives a round trip", () => {
    const bodies = toCreateRules(flow);
    const rest = bodies.find(
      (body) => body.actionConfig[REMAINDER_MARKER] === true,
    );
    expect(rest).toBeDefined();
    expect(rest?.actionConfig.toSubAccountId).toBe("sub_everyday");
  });

  it("round-trips: create bodies read back as the same split shape", () => {
    const bodies = toCreateRules(flow);
    const asRules = bodies.map((body, index) =>
      rule({
        id: `new_${index}`,
        name: body.name,
        accountId: body.accountId,
        triggerConfig: body.triggerConfig,
        actionConfig: body.actionConfig,
        enabled: body.enabled,
      }),
    );

    const [roundTripped] = toFlows(asRules);
    expect(roundTripped.name).toBe("Payday");
    expect(roundTripped.setAsides).toHaveLength(1);
    expect(roundTripped.splits).toHaveLength(2);
    expect(roundTripped.splits.filter((s) => s.isRemainder)).toHaveLength(1);
  });
});
