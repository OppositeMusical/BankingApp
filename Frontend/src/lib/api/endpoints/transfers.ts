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

export type InternalTransfer = {
  fromSubAccountId: string;
  toSubAccountId: string;
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
        const { transfer: result } = await apiFetch("/transfers/internal", {
          method: "POST",
          idempotencyKey,
          body: {
            sourceSubAccountId: transfer.fromSubAccountId,
            destinationSubAccountId: transfer.toSubAccountId,
            amount: transfer.amount.amount,
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
