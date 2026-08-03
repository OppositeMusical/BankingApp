import { describe, expect, it } from "vitest";
import { flowRuns, flows, sourceSuggestions } from "./flows";
import { totalPercentage } from "@/lib/flows/split-deposit";

/*
 * The fixtures stand in for real API responses, so they have to obey the same
 * invariants the arithmetic guarantees. Without this, a hand-edited fixture can
 * quietly show a split that doesn't add up.
 */

describe("flow fixtures", () => {
  it("gives every flow exactly one remainder split", () => {
    for (const flow of flows) {
      const remainders = flow.splits.filter((split) => split.isRemainder);
      expect(remainders, `${flow.name} remainder count`).toHaveLength(1);
    }
  });

  it("keeps every flow's user-set percentages at or under 100", () => {
    for (const flow of flows) {
      expect(totalPercentage(flow.splits), flow.name).toBeLessThanOrEqual(100);
    }
  });

  it("never gives the remainder split its own percentage", () => {
    for (const flow of flows) {
      const remainder = flow.splits.find((split) => split.isRemainder);
      expect(remainder?.percentage, flow.name).toBeUndefined();
    }
  });

  it("reconciles every recorded run to the cent", () => {
    for (const run of flowRuns) {
      const total = run.lines.reduce((sum, line) => sum + line.amount.amount, 0);
      expect(total, `run ${run.id}`).toBe(run.depositAmount.amount);
    }
  });

  it("gives skipped and redirected lines a zero amount and a reason", () => {
    for (const run of flowRuns) {
      for (const line of run.lines) {
        if (line.status === "sent") continue;
        expect(line.amount.amount, `${run.id}/${line.splitId}`).toBe(0);
        expect(line.note, `${run.id}/${line.splitId}`).toBeTruthy();
      }
    }
  });

  it("points every run at a flow that exists", () => {
    const ids = new Set(flows.map((flow) => flow.id));
    for (const run of flowRuns) {
      expect(ids.has(run.flowId), run.id).toBe(true);
    }
  });

  it("marks a suggestion as used exactly when a flow claims that payer", () => {
    const claimed = new Set(flows.map((flow) => flow.source.displayName));
    for (const suggestion of sourceSuggestions) {
      expect(Boolean(suggestion.alreadyUsed), suggestion.displayName).toBe(
        claimed.has(suggestion.displayName),
      );
    }
  });
});
