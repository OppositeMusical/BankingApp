import { describe, expect, it } from "vitest";
import { remainderPercentage, splitDeposit, totalPercentage } from "./split-deposit";
import type { Flow, FlowRunLine, FlowSetAside, FlowSplit } from "@/lib/types/flows";

const usd = (amount: number) => ({ amount, currency: "USD" });

const account = (id: string) => ({ kind: "account" as const, accountId: id });
const goal = (id: string) => ({ kind: "goal" as const, goalId: id });

function makeFlow(
  splits: FlowSplit[],
  setAsides: FlowSetAside[] = [],
  overrides: Partial<Flow> = {},
): Flow {
  return {
    id: "flow_test",
    name: "Test flow",
    state: "active",
    source: {
      id: "src_1",
      displayName: "Test Payer",
      matchPatterns: ["TEST PAYER"],
      arrivesInAccountId: "acc_checking",
      cadence: "monthly",
    },
    setAsides,
    splits,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** The invariant that matters most: nothing is created or lost. */
function expectReconciles(lines: FlowRunLine[], deposit: number) {
  const total = lines.reduce((sum, line) => sum + line.amount.amount, 0);
  expect(total).toBe(deposit);
  for (const line of lines) {
    expect(line.amount.amount).toBeGreaterThanOrEqual(0);
  }
}

const basicSplits: FlowSplit[] = [
  { id: "s_rest", destination: account("acc_checking"), isRemainder: true },
  { id: "s_safety", destination: goal("goal_emergency"), percentage: 20, isRemainder: false },
  { id: "s_career", destination: goal("goal_career"), percentage: 25, isRemainder: false },
  { id: "s_house", destination: account("acc_joint"), percentage: 15, isRemainder: false },
];

describe("splitDeposit — core arithmetic", () => {
  it("splits the spec's worked example exactly (§6)", () => {
    // $4,127.33 with 50 / 30 and a 20% remainder.
    const flow = makeFlow([
      { id: "s_rest", destination: account("acc_checking"), isRemainder: true },
      { id: "s_a", destination: goal("goal_emergency"), percentage: 50, isRemainder: false },
      { id: "s_b", destination: goal("goal_career"), percentage: 30, isRemainder: false },
    ]);

    const result = splitDeposit(flow, usd(412_733));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.lines.map((l) => [l.splitId, l.amount.amount]));
    expect(byId.s_a).toBe(206_366);
    expect(byId.s_b).toBe(123_819);
    // Rest gets its 20% plus the 1.4c the floors dropped.
    expect(byId.s_rest).toBe(82_548);
    expectReconciles(result.lines, 412_733);
  });

  it("splits the builder's example deposit evenly", () => {
    const result = splitDeposit(makeFlow(basicSplits), usd(612_500));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.lines.map((l) => [l.splitId, l.amount.amount]));
    expect(byId.s_safety).toBe(122_500);
    expect(byId.s_career).toBe(153_125);
    expect(byId.s_house).toBe(91_875);
    expect(byId.s_rest).toBe(245_000);
    expectReconciles(result.lines, 612_500);
  });

  it("reconciles for a large sweep of awkward amounts", () => {
    const flow = makeFlow(basicSplits);
    for (let amount = 1; amount <= 5_000; amount++) {
      const result = splitDeposit(flow, usd(amount));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expectReconciles(result.lines, amount);
    }
  });

  it("reconciles for percentages that never divide evenly", () => {
    const thirds = makeFlow([
      { id: "s_rest", destination: account("acc_checking"), isRemainder: true },
      { id: "s_a", destination: goal("goal_emergency"), percentage: 33, isRemainder: false },
      { id: "s_b", destination: goal("goal_career"), percentage: 33, isRemainder: false },
      { id: "s_c", destination: goal("goal_home"), percentage: 33, isRemainder: false },
    ]);
    for (const amount of [1, 2, 3, 7, 99, 101, 1_000_001]) {
      const result = splitDeposit(thirds, usd(amount));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expectReconciles(result.lines, amount);
    }
  });

  it("gives everything to Rest when it is the only split", () => {
    const flow = makeFlow([
      { id: "s_rest", destination: account("acc_checking"), isRemainder: true },
    ]);
    const result = splitDeposit(flow, usd(50_000));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].amount.amount).toBe(50_000);
  });

  it("handles a one-cent deposit without producing negative lines", () => {
    const result = splitDeposit(makeFlow(basicSplits), usd(1));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expectReconciles(result.lines, 1);
    // Every percentage floors to zero; Rest keeps the cent.
    expect(result.lines.find((l) => l.splitId === "s_rest")?.amount.amount).toBe(1);
  });
});

describe("splitDeposit — set-asides (§6, §7)", () => {
  const setAsides: FlowSetAside[] = [
    { id: "sa_rent", destination: account("acc_joint"), amount: usd(145_000), label: "Rent" },
    { id: "sa_safety", destination: goal("goal_emergency"), amount: usd(20_000), label: "Safety net" },
  ];

  it("takes set-asides off the top before percentages", () => {
    const flow = makeFlow(basicSplits, setAsides);
    const result = splitDeposit(flow, usd(612_500));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = Object.fromEntries(result.lines.map((l) => [l.splitId, l.amount.amount]));
    expect(byId.sa_rent).toBe(145_000);
    expect(byId.sa_safety).toBe(20_000);
    // Percentages apply to 612500 - 165000 = 447500.
    expect(byId.s_safety).toBe(89_500); // 20%
    expectReconciles(result.lines, 612_500);
  });

  it("skips a set-aside that doesn't fit, and every one after it", () => {
    const flow = makeFlow(basicSplits, setAsides);
    // Enough for rent, not enough for the safety net top-up.
    const result = splitDeposit(flow, usd(150_000));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const rent = result.lines.find((l) => l.splitId === "sa_rent");
    const safety = result.lines.find((l) => l.splitId === "sa_safety");
    expect(rent?.status).toBe("sent");
    expect(rent?.amount.amount).toBe(145_000);
    // All-or-nothing: not partially funded.
    expect(safety?.status).toBe("skipped");
    expect(safety?.amount.amount).toBe(0);
    expect(safety?.note).toMatch(/smaller than usual/i);
    expectReconciles(result.lines, 150_000);
  });

  it("skips a later set-aside that would fit, preserving priority order", () => {
    const flow = makeFlow(basicSplits, [
      { id: "sa_big", destination: account("acc_joint"), amount: usd(500_000), label: "Big" },
      { id: "sa_small", destination: goal("goal_emergency"), amount: usd(100), label: "Small" },
    ]);
    const result = splitDeposit(flow, usd(1_000));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // The small one fits, but funding it would silently reorder priorities.
    expect(result.lines.find((l) => l.splitId === "sa_small")?.status).toBe("skipped");
    expectReconciles(result.lines, 1_000);
  });

  it("reconciles when a set-aside consumes the entire deposit", () => {
    const flow = makeFlow(basicSplits, [
      { id: "sa_all", destination: account("acc_joint"), amount: usd(10_000), label: "All" },
    ]);
    const result = splitDeposit(flow, usd(10_000));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lines.find((l) => l.splitId === "sa_all")?.amount.amount).toBe(10_000);
    expect(result.lines.find((l) => l.splitId === "s_rest")?.amount.amount).toBe(0);
    expectReconciles(result.lines, 10_000);
  });
});

describe("splitDeposit — unavailable destinations (§7)", () => {
  it("redirects a frozen destination's share to Rest", () => {
    const flow = makeFlow(basicSplits);
    const result = splitDeposit(flow, usd(612_500), {
      frozenAccountIds: ["acc_joint"],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const house = result.lines.find((l) => l.splitId === "s_house");
    expect(house?.status).toBe("redirected");
    expect(house?.amount.amount).toBe(0);
    expect(house?.note).toMatch(/frozen/i);

    // Rest keeps its own 40% plus the redirected 15%.
    expect(result.lines.find((l) => l.splitId === "s_rest")?.amount.amount).toBe(
      245_000 + 91_875,
    );
    expectReconciles(result.lines, 612_500);
  });

  it("refuses to run when a destination no longer exists", () => {
    const flow = makeFlow(basicSplits);
    const result = splitDeposit(flow, usd(612_500), {
      missingGoalIds: ["goal_career"],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/no longer exists/i);
  });

  it("refuses to run when the Rest destination itself is frozen", () => {
    const flow = makeFlow(basicSplits);
    const result = splitDeposit(flow, usd(612_500), {
      frozenAccountIds: ["acc_checking"],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/frozen/i);
  });
});

describe("splitDeposit — structural guards", () => {
  it("refuses a flow with no Rest split", () => {
    const flow = makeFlow([
      { id: "s_a", destination: goal("goal_emergency"), percentage: 100, isRemainder: false },
    ]);
    expect(splitDeposit(flow, usd(1_000)).ok).toBe(false);
  });

  it("refuses a flow with two Rest splits", () => {
    const flow = makeFlow([
      { id: "s_r1", destination: account("acc_checking"), isRemainder: true },
      { id: "s_r2", destination: account("acc_savings"), isRemainder: true },
    ]);
    expect(splitDeposit(flow, usd(1_000)).ok).toBe(false);
  });

  it("refuses percentages totalling more than 100", () => {
    const flow = makeFlow([
      { id: "s_rest", destination: account("acc_checking"), isRemainder: true },
      { id: "s_a", destination: goal("goal_emergency"), percentage: 80, isRemainder: false },
      { id: "s_b", destination: goal("goal_career"), percentage: 40, isRemainder: false },
    ]);
    expect(splitDeposit(flow, usd(1_000)).ok).toBe(false);
  });

  it("refuses a zero or negative deposit", () => {
    const flow = makeFlow(basicSplits);
    expect(splitDeposit(flow, usd(0)).ok).toBe(false);
    expect(splitDeposit(flow, usd(-500)).ok).toBe(false);
  });
});

describe("percentage helpers", () => {
  it("excludes Rest from the user-set total", () => {
    expect(totalPercentage(basicSplits)).toBe(60);
  });

  it("derives the Rest share", () => {
    expect(remainderPercentage(basicSplits)).toBe(40);
  });

  it("never reports a negative Rest share", () => {
    expect(
      remainderPercentage([
        { id: "s_rest", destination: account("acc_checking"), isRemainder: true },
        { id: "s_a", destination: goal("goal_emergency"), percentage: 130, isRemainder: false },
      ]),
    ).toBe(0);
  });
});
