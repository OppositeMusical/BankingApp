import { apiFetch } from "../client";
import {
  toAccount,
  toAccountFromContainer,
  toHolder,
} from "../adapters/account";
import { toTransaction } from "../adapters/transaction";
import { isServed } from "./registry";
import {
  AccountSchema,
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
    // Resolves on `accounts.list`, which Go DOES implement — not on
    // `accounts.subAccounts`, which it doesn't. Keying this on sub-accounts
    // meant one unimplemented endpoint replaced the user's real accounts with
    // fixtures, so live mode showed invented accounts and there was no way to
    // tell what was actually there.
    resolve("accounts.list", {
      live: async () => {
        const { accounts } = await apiFetch("/accounts", {
          schema: listOf("accounts", AccountSchema),
        });

        const perAccount = await Promise.all(
          accounts.map(async (account) => {
            // Sub-accounts are the richer shape, but optional: unimplemented
            // today, and a user may legitimately have none. Either way the
            // container still describes a real account.
            const [subAccounts, members] = await Promise.all([
              isServed("accounts.subAccounts")
                ? apiFetch(`/accounts/${account.id}/sub-accounts`, {
                    schema: SubAccountsResponse,
                  }).catch(() => ({ subAccounts: [] }))
                : Promise.resolve({ subAccounts: [] }),
              isServed("accounts.members")
                ? apiFetch(`/accounts/${account.id}/members`, {
                    schema: MembersResponse,
                  }).catch(() => ({ members: [] }))
                : Promise.resolve({ members: [] }),
            ]);

            // The bank account itself comes FIRST, then its sub-accounts.
            //
            // It used to be dropped whenever sub-accounts existed, which hid
            // the real Column account entirely and undercounted every total by
            // whatever sat unallocated in it. The two are siblings in the
            // ledger: moving $500 into a sub-account takes $500 out of the
            // bank account, and the sum of both is what the customer has.
            const bankAccount = toAccountFromContainer(account);

            // Sub-accounts share the parent's numbers. An inbound wire reaches
            // one through the bank account's details, not any of its own.
            return [
              bankAccount,
              ...subAccounts.subAccounts.map((subAccount) =>
                toAccount(subAccount, {
                  members: members.members,
                  parentAccountId: account.id,
                  bank: bankAccount.bank,
                  parentName: bankAccount.name,
                }),
              ),
            ];
          }),
        );

        return perAccount.flat();
      },
      fixture: () => withLatency(accountFixtures),
    }),

  /**
   * Open a sub-account.
   *
   * Created empty: it starts at zero and is funded by a transfer like anything
   * else, which keeps opening one off the money path entirely.
   */
  createSubAccount: (
    bankAccountId: string,
    label: string,
  ): Promise<Account | undefined> =>
    resolve("accounts.subAccounts", {
      scopedTo: bankAccountId,
      live: async () => {
        const { subAccount } = await apiFetch(
          `/accounts/${bankAccountId}/sub-accounts`,
          {
            method: "POST",
            body: { label },
            schema: oneOf("subAccount", SubAccountSchema),
          },
        );
        return toAccount(subAccount, { parentAccountId: bankAccountId });
      },
      fixture: () => undefined,
      empty: () => undefined,
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
      empty: () => undefined,
    }),

  /**
   * Recent activity across several accounts, newest first.
   *
   * The contract has no cross-account feed, so this composes the per-account
   * pages. `limit` bounds both the per-account fetch and the merged result.
   */
  activity: async (accounts: Account[], limit = 25): Promise<Transaction[]> => {
    const pages = await Promise.all(
      accounts.map((account) => accountsApi.transactions(account, { limit })),
    );
    return pages
      .flatMap((page) => page.items)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, limit);
  },

  /**
   * Activity for one UI account.
   *
   * Takes the account rather than an id because the two are not the same on
   * the wire: a UI account is usually a SUB-account, and the endpoint is keyed
   * on the container with `?subAccountId=` selecting the pot. Passing the
   * sub-account id as the path segment is a 404, which is exactly what
   * happened the first time real sub-accounts appeared.
   */
  transactions: (
    account: Account | string,
    query: TransactionQuery = {},
  ): Promise<Page<Transaction>> => {
    const holder =
      typeof account === "string"
        ? { accountId: account, subAccountId: undefined }
        : toHolder(account);

    return resolve("accounts.transactions", {
      scopedTo: holder.accountId,
      live: async () => {
        const response = await apiFetch(
          `/accounts/${holder.accountId}/transactions`,
          {
            query: { ...query, subAccountId: holder.subAccountId },
            schema: TransactionsResponse,
          },
        );
        return {
          items: response.transactions.map(toTransaction),
          nextCursor: response.nextCursor,
          hasMore: response.hasMore,
        };
      },
      fixture: () =>
        withLatency({
          items: transactionFixtures.filter(
            (transaction) =>
              transaction.accountId ===
              (holder.subAccountId ?? holder.accountId),
          ),
          nextCursor: null,
          hasMore: false,
        }),
      empty: () => ({ items: [], nextCursor: null, hasMore: false }),
    });
  },
};
