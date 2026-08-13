import { apiFetch } from "../client";
import { toMoney } from "../adapters/money";
import { BudgetSchema, listOf } from "../wire";
import { resolve } from "./resolve";
import type { Money, SpendingSlice, TransactionCategory } from "@/lib/types/banking";
import { toTransactionCategory } from "../adapters/transaction";

/* Budgets.  ⇄  openapi.yaml #/paths/~1accounts~1{id}~1budgets */

const BudgetsResponse = listOf("budgets", BudgetSchema);

export type Budget = {
  id: string;
  category: TransactionCategory;
  limit: Money;
  spent: Money;
  percentUsed: number;
  exceeded: boolean;
};

export const budgetsApi = {
  list: (accountId: string): Promise<Budget[]> =>
    resolve("budgets.list", {
      scopedTo: accountId,
      live: async () => {
        // derived=true: spend recomputed from the journal, not the cache.
        // Nothing increments the cache yet, so the cached figure is always 0.
        const { budgets } = await apiFetch(`/accounts/${accountId}/budgets`, {
          query: { derived: true },
          schema: BudgetsResponse,
        });
        return budgets.map((b) => ({
          id: b.id,
          category: toTransactionCategory(b.category, "transfer_internal"),
          limit: toMoney(b.monthlyLimit),
          spent: toMoney(b.currentSpend),
          percentUsed: b.percentUsed,
          exceeded: b.exceeded,
        }));
      },
      fixture: () => [],
      empty: () => [],
    }),

  /** Budgets as spending slices, which is what the insights charts take. */
  spending: async (accountId: string): Promise<SpendingSlice[]> =>
    (await budgetsApi.list(accountId))
      .filter((b) => b.spent.amount > 0)
      .map((b) => ({ category: b.category, total: b.spent })),
};
