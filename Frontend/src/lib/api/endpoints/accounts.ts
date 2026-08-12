import { apiFetch } from "../client";
import { toAccount } from "../adapters/account";
import { toTransaction } from "../adapters/transaction";
import {
  BalanceSchema,
  MemberSchema,
  SubAccountSchema,
  TransactionSchema,
  listOf,
  oneOf,
  pageOf,
  type Page,
} from "../wire";
import { resolve, withLatency } from "./resolve";
import { accounts as accountFixtures, transactions as transactionFixtures } from "@/lib/mock/data";
import type { Account, Money, Transaction } from "@/lib/types/banking";

/*
 * Accounts.  ⇄  openapi.yaml #/paths/~1accounts
 *
 * The only place account URLs exist.
 *
 * A UI "account" is a wire sub-account, so `list()` needs two calls in live
 * mode: the containers, then the labelled pots inside each. Members come from
 * the parent, since roles are granted on the container rather than the pot.
 */

const SubAccountsResponse = listOf("subAccounts", SubAccountSchema);
const MembersResponse = listOf("members", MemberSchema);
const TransactionsResponse = pageOf("transactions", TransactionSchema);
const BalanceResponse = oneOf("balance", BalanceSchema);

export type TransactionQuery = {
  cursor?: string;
  limit?: number;
  from?: string;
  to?: string;
};

export const accountsApi = {
  /**
   * Every account the user can see, as the UI understands the word.
   *
   * `accounts.subAccounts` is not served yet, so in practice this returns
   * fixtures today — but the live path is written and exercised the moment Go
   * registers the route.
   */
  list: (): Promise<Account[]> =>
    resolve("accounts.subAccounts", {
      live: async () => {
        const { accounts } = await apiFetch("/accounts", {
          schema: listOf("accounts", SubAccountSchema.pick({ id: true })),
        });

        const perAccount = await Promise.all(
          accounts.map(async (account) => {
            const [subAccounts, members] = await Promise.all([
              apiFetch(`/accounts/${account.id}/sub-accounts`, {
                schema: SubAccountsResponse,
              }),
              apiFetch(`/accounts/${account.id}/members`, {
                schema: MembersResponse,
              }).catch(() => ({ members: [] })),
            ]);
            return subAccounts.subAccounts.map((subAccount) =>
              toAccount(subAccount, {
                members: members.members,
                parentAccountId: account.id,
              }),
            );
          }),
        );

        return perAccount.flat();
      },
      fixture: () => withLatency(accountFixtures),
    }),

  get: (id: string): Promise<Account | undefined> =>
    accountsApi
      .list()
      .then((accounts) => accounts.find((account) => account.id === id)),

  balance: (id: string): Promise<Money | undefined> =>
    resolve("accounts.balance", {
      scopedTo: id,
      live: async () => {
        const { balance } = await apiFetch(`/accounts/${id}/balance`, {
          schema: BalanceResponse,
        });
        return { amount: balance.available.amount, currency: balance.available.currency };
      },
      fixture: () =>
        accountFixtures.find((account) => account.id === id)?.available,
    }),

  /**
   * Recent activity across several accounts, newest first.
   *
   * The contract has no cross-account feed, so this composes the per-account
   * pages. `limit` bounds both the per-account fetch and the merged result.
   */
  activity: async (accountIds: string[], limit = 25): Promise<Transaction[]> => {
    const pages = await Promise.all(
      accountIds.map((id) => accountsApi.transactions(id, { limit })),
    );
    return pages
      .flatMap((page) => page.items)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, limit);
  },

  transactions: (
    id: string,
    query: TransactionQuery = {},
  ): Promise<Page<Transaction>> =>
    resolve("accounts.transactions", {
      scopedTo: id,
      live: async () => {
        const response = await apiFetch(`/accounts/${id}/transactions`, {
          query,
          schema: TransactionsResponse,
        });
        return {
          items: response.transactions.map(toTransaction),
          nextCursor: response.nextCursor,
          hasMore: response.hasMore,
        };
      },
      fixture: () =>
        withLatency({
          items: transactionFixtures.filter(
            (transaction) => transaction.accountId === id,
          ),
          nextCursor: null,
          hasMore: false,
        }),
    }),
};
