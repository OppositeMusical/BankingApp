import { apiFetch } from "../client";
import { toCreateRules, toFlows } from "../adapters/flow";
import { RuleSchema, listOf } from "../wire";
import { resolve, withLatency } from "./resolve";
import { flows as flowFixtures } from "@/lib/mock/flows";
import type { Flow } from "@/lib/types/flows";

/*
 * Flows.  ⇄  openapi.yaml #/paths/~1rules
 *
 * There is no /flows endpoint and there should not be one — a Flow is a view
 * over rules, and inventing a parallel resource would put the same state in
 * two places. The grouping lives in adapters/flow.ts.
 *
 * None of these are served by Go yet, so every call resolves to fixtures
 * today. The live paths are written so that shipping /rules is a change to
 * registry.ts and nothing else.
 */

const RulesResponse = listOf("rules", RuleSchema);

export const flowsApi = {
  list: (accountId?: string): Promise<Flow[]> =>
    resolve("rules.list", {
      live: async () => {
        const { rules } = await apiFetch("/rules", {
          query: { accountId },
          schema: RulesResponse,
        });
        return toFlows(rules);
      },
      fixture: () => withLatency(flowFixtures),
      // /rules is not implemented, so in live mode the user has no flows.
      // The flows page's empty state teaches the concept with a worked
      // example, which is a far better answer than three invented flows.
      empty: () => [],
    }),

  get: (id: string): Promise<Flow | undefined> =>
    flowsApi.list().then((flows) => flows.find((flow) => flow.id === id)),

  /**
   * Creating a Flow creates N rules.
   *
   * They are posted in sequence rather than in parallel: the contract has no
   * way to say "these succeed or fail together", and a half-created Flow is
   * easier to reason about — and to clean up — when the order is known.
   */
  create: (flow: Flow): Promise<Flow> =>
    resolve("rules.create", {
      live: async () => {
        const bodies = toCreateRules(flow);
        const created = [];
        for (const body of bodies) {
          const response = await apiFetch("/rules", {
            method: "POST",
            body,
            schema: RuleSchema.or(
              listOf("rules", RuleSchema).transform((r) => r.rules[0]),
            ),
            // Derived from the flow and destination, so a retried create
            // cannot produce a duplicate rule.
            idempotencyKey: `${flow.id}:${body.name}`,
          });
          created.push(response);
        }
        const [result] = toFlows(created.flat());
        return result ?? flow;
      },
      fixture: () => withLatency(flow),
    }),

  setEnabled: (flow: Flow, enabled: boolean): Promise<void> =>
    resolve("rules.update", {
      live: async () => {
        // Every rule in the Flow moves together — pausing half of a split
        // would silently change where money goes.
        await Promise.all(
          flow.splits.concat(flow.setAsides as never[]).map((part) =>
            apiFetch(`/rules/${part.id}`, {
              method: "PATCH",
              body: { enabled },
            }),
          ),
        );
      },
      fixture: () => undefined,
    }),

  remove: (flow: Flow): Promise<void> =>
    resolve("rules.delete", {
      live: async () => {
        await Promise.all(
          flow.splits.concat(flow.setAsides as never[]).map((part) =>
            apiFetch(`/rules/${part.id}`, { method: "DELETE" }),
          ),
        );
      },
      fixture: () => undefined,
    }),
};
