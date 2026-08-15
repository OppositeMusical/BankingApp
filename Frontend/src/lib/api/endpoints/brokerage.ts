import { z } from "zod";
import { apiFetch } from "../client";
import { toMoney } from "../adapters/money";
import { MoneySchema, listOf, oneOf } from "../wire";
import { resolve } from "./resolve";
import type { Money } from "@/lib/types/banking";

/*
 * Paper trading.  ⇄  openapi.yaml #/paths/~1brokerage~1orders
 *
 * Quantities cross the wire as decimal STRINGS, not numbers: shares are stored
 * scaled by 1e9 and a float would quietly lose the tail. They are parsed for
 * display only, never for arithmetic.
 */

const BrokerageAccountSchema = z.object({
  id: z.string(),
  fundingAccountId: z.string(),
  provider: z.string(),
  cashBalance: MoneySchema,
  status: z.string(),
});

const HoldingSchema = z.object({
  symbol: z.string(),
  quantity: z.string(),
  averageCost: MoneySchema,
  costBasis: MoneySchema,
});

const OrderSchema = z.object({
  id: z.string(),
  side: z.enum(["buy", "sell"]),
  symbol: z.string(),
  notional: MoneySchema.nullable().optional(),
  filledQuantity: z.string(),
  filledAvgPrice: MoneySchema.nullable().optional(),
  status: z.string(),
  failureReason: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type BrokerageAccount = {
  id: string;
  fundingAccountId: string;
  cashBalance: Money;
  status: string;
};

export type Holding = {
  symbol: string;
  quantity: number;
  averageCost: Money;
  costBasis: Money;
};

export type Order = {
  id: string;
  side: "buy" | "sell";
  symbol: string;
  notional?: Money;
  filledQuantity: number;
  filledAvgPrice?: Money;
  status: string;
  failureReason?: string;
  createdAt: string;
};

/** One point on the account's real value curve. */
export type PortfolioPoint = { at: string; value: number };

const PortfolioHistorySchema = z.object({
  points: z.array(z.object({ at: z.string(), value: MoneySchema })),
});

export const brokerageApi = {
  /**
   * The account's actual value over time.
   *
   * Returns null until the backend serves it, which is the signal for the
   * chart to fall back to approximating from today's holdings — and to say so.
   * The two answer different questions: this one accounts for what was bought
   * and sold along the way.
   */
  portfolioHistory: (range: string): Promise<PortfolioPoint[] | null> =>
    resolve("brokerage.portfolioHistory", {
      live: async () => {
        const data = await apiFetch("/brokerage/portfolio/history", {
          query: { range },
          schema: PortfolioHistorySchema,
        });
        return data.points.map((point) => ({
          at: point.at,
          value: point.value.amount / 100,
        }));
      },
      fixture: () => null,
      empty: () => null,
    }),

  /** The account, or null when the user has not opened one. */
  account: (): Promise<BrokerageAccount | null> =>
    resolve("brokerage.account", {
      live: async () => {
        const { brokerageAccount } = await apiFetch("/brokerage/account", {
          schema: oneOf("brokerageAccount", BrokerageAccountSchema),
        }).catch(() => ({ brokerageAccount: null }));
        return brokerageAccount
          ? {
              id: brokerageAccount.id,
              fundingAccountId: brokerageAccount.fundingAccountId,
              cashBalance: toMoney(brokerageAccount.cashBalance),
              status: brokerageAccount.status,
            }
          : null;
      },
      fixture: () => null,
      empty: () => null,
    }),

  open: (fundingAccountId: string): Promise<void> =>
    resolve("brokerage.account", {
      live: async () => {
        await apiFetch("/brokerage/account", {
          method: "POST",
          body: { fundingAccountId },
        });
      },
      fixture: () => undefined,
      empty: () => undefined,
    }),

  holdings: (): Promise<Holding[]> =>
    resolve("brokerage.holdings", {
      live: async () => {
        const { holdings } = await apiFetch("/brokerage/holdings", {
          schema: listOf("holdings", HoldingSchema),
        });
        return holdings.map((h) => ({
          symbol: h.symbol,
          quantity: Number(h.quantity),
          averageCost: toMoney(h.averageCost),
          costBasis: toMoney(h.costBasis),
        }));
      },
      fixture: () => [],
      empty: () => [],
    }),

  orders: (): Promise<Order[]> =>
    resolve("brokerage.orders", {
      live: async () => {
        const { orders } = await apiFetch("/brokerage/orders", {
          schema: listOf("orders", OrderSchema),
        });
        return orders.map((o) => ({
          id: o.id,
          side: o.side,
          symbol: o.symbol,
          notional: o.notional ? toMoney(o.notional) : undefined,
          filledQuantity: Number(o.filledQuantity),
          filledAvgPrice: o.filledAvgPrice
            ? toMoney(o.filledAvgPrice)
            : undefined,
          status: o.status,
          failureReason: o.failureReason ?? undefined,
          createdAt: o.createdAt,
        }));
      },
      fixture: () => [],
      empty: () => [],
    }),

  /**
   * @param idempotencyKey Minted when the form opens, not on submit — a
   * double-click must not place two orders.
   */
  placeOrder: (
    order: { side: "buy" | "sell"; symbol: string; amount: Money },
    idempotencyKey: string,
  ): Promise<Order> =>
    resolve<Order>("brokerage.orders", {
      live: async () => {
        const { order: placed } = await apiFetch("/brokerage/orders", {
          method: "POST",
          idempotencyKey,
          body: {
            side: order.side,
            symbol: order.symbol,
            notional: order.amount.amount,
          },
          schema: oneOf("order", OrderSchema),
        });
        return {
          id: placed.id,
          side: placed.side,
          symbol: placed.symbol,
          notional: placed.notional ? toMoney(placed.notional) : undefined,
          filledQuantity: Number(placed.filledQuantity),
          filledAvgPrice: placed.filledAvgPrice
            ? toMoney(placed.filledAvgPrice)
            : undefined,
          status: placed.status,
          failureReason: placed.failureReason ?? undefined,
          createdAt: placed.createdAt,
        };
      },
      fixture: () => {
        throw new Error("Trading is not available with sample data.");
      },
      empty: () => {
        throw new Error("Trading is not available yet.");
      },
    }),
};
