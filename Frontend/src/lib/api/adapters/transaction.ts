import type { Transaction, TransactionCategory } from "@/lib/types/banking";
import { toMoney } from "./money";
import type { WireTransaction } from "../wire";

/*
 * Transactions.
 *
 * Two category vocabularies exist and neither contains the other. The wire's
 * SpendCategory has no `housing`, `childcare`, `personal`, `savings` or
 * `fees`; the UI has no `dining`, `fuel`, `shopping`, `entertainment`,
 * `subscriptions` or `transfers`. Everything unmapped lands on `other` rather
 * than being guessed at, so a category shown to a user is always one the
 * backend actually asserted.
 */

const categoryMap: Record<string, TransactionCategory> = {
  groceries: "groceries",
  dining: "groceries",
  transport: "transport",
  fuel: "transport",
  travel: "personal",
  shopping: "personal",
  entertainment: "personal",
  subscriptions: "personal",
  utilities: "housing",
  rent: "housing",
  healthcare: "health",
  education: "education",
  transfers: "savings",
  income: "income",
  other: "other",
};

export function toTransactionCategory(
  wireCategory: string | null | undefined,
  entryType: WireTransaction["type"],
): TransactionCategory {
  // Entry type is the more reliable signal when it is decisive — a fee is a
  // fee regardless of how the merchant was categorised.
  if (entryType === "fee") return "fees";
  if (entryType === "interest" || entryType === "external_deposit") {
    return "income";
  }
  if (entryType === "subaccount_funding") return "savings";
  if (!wireCategory) return "other";
  return categoryMap[wireCategory] ?? "other";
}

export function toTransaction(wire: WireTransaction): Transaction {
  return {
    id: wire.id,
    accountId: wire.subAccountId ?? wire.accountId,
    merchant: wire.merchantName ?? wire.description ?? "Transaction",
    // `signedAmount` is already negative for a debit from this holder's
    // perspective, which is exactly the sign convention the UI renders.
    amount: toMoney(wire.signedAmount),
    category: toTransactionCategory(wire.category, wire.type),
    status: wire.status,
    occurredAt: wire.createdAt,
    note: wire.description ?? undefined,
    // `initiatedBy` has no wire equivalent — the contract does not say which
    // member of a joint account made a charge. Left unset rather than guessed.
  };
}
