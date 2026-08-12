import { apiFetch } from "../client";
import { toMoney } from "../adapters/money";
import { TransferSchema, oneOf } from "../wire";
import { resolve, withLatency } from "./resolve";
import type { Money } from "@/lib/types/banking";

/*
 * Transfers.  ⇄  openapi.yaml #/paths/~1transfers~1internal
 *
 * The one place in the app where a request moves money, and the only place an
 * idempotency key is mandatory rather than optional. `apiFetch` will not retry
 * a POST without one.
 */

const TransferResponse = oneOf("transfer", TransferSchema);

/**
 * One side of a transfer, in the wire's vocabulary: the container account,
 * plus the sub-account within it when there is one. `toHolder()` in
 * adapters/account.ts builds this from a UI account.
 */
export type TransferHolder = {
  accountId: string;
  subAccountId?: string;
};

export type InternalTransfer = {
  from: TransferHolder;
  /** Exactly one of the three destination forms, per the contract. */
  to: TransferHolder | { userEmail: string };
  amount: Money;
  description?: string;
};

export type TransferResult = {
  id: string;
  reference: string;
  status: "pending" | "settled" | "failed" | "canceled";
  amount: Money;
  failureReason?: string;
};

export const transfersApi = {
  /**
   * @param idempotencyKey Must be stable for one user intent. Generate it when
   * the form is opened, not when it is submitted — otherwise a double-click
   * produces two keys and two transfers.
   */
  internal: (
    transfer: InternalTransfer,
    idempotencyKey: string,
  ): Promise<TransferResult> =>
    resolve<TransferResult>("transfers.internal", {
      live: async () => {
        // Field names follow openapi.yaml exactly — the Go handler rejects
        // unknown fields, so `sourceAccountId`-style names (which the contract
        // uses only on the RESPONSE) would 400 here.
        const to = transfer.to;
        const { transfer: result } = await apiFetch("/transfers/internal", {
          method: "POST",
          idempotencyKey,
          body: {
            fromAccountId: transfer.from.accountId,
            fromSubAccountId: transfer.from.subAccountId,
            ...("userEmail" in to
              ? { toUserEmail: to.userEmail }
              : {
                  toAccountId: to.subAccountId ? undefined : to.accountId,
                  toSubAccountId: to.subAccountId,
                }),
            amount: transfer.amount.amount,
            currency: transfer.amount.currency,
            description: transfer.description,
          },
          schema: TransferResponse,
        });
        return {
          id: result.id,
          reference: result.reference,
          status: result.status,
          amount: toMoney(result.amount),
          failureReason: result.failureReason ?? undefined,
        };
      },
      fixture: () =>
        withLatency({
          id: `trf_${idempotencyKey.slice(0, 8)}`,
          reference: `SIM-${idempotencyKey.slice(0, 6).toUpperCase()}`,
          status: "settled" as const,
          amount: transfer.amount,
        }),
    }),

  get: (id: string): Promise<TransferResult | undefined> =>
    resolve("transfers.get", {
      live: async () => {
        const { transfer } = await apiFetch(`/transfers/${id}`, {
          schema: TransferResponse,
        });
        return {
          id: transfer.id,
          reference: transfer.reference,
          status: transfer.status,
          amount: toMoney(transfer.amount),
          failureReason: transfer.failureReason ?? undefined,
        };
      },
      fixture: () => undefined,
    }),
};
