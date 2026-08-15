"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw, TrendingDown, TrendingUp } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { StatTile } from "@/components/banking/stat-tile";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { brokerageApi, describeError } from "@/lib/api";
import { formatFullDate } from "@/lib/format/date";
import { MarketPanel } from "./market-panel";
import { nameFor, searchSymbols } from "@/lib/market/symbols";
import type {
  BrokerageAccount,
  Holding,
  Order,
} from "@/lib/api/endpoints/brokerage";
import type { Quote } from "@/lib/market/quotes";
import type { Money } from "@/lib/types/banking";
import { cn } from "@/lib/utils/cn";

/**
 * Statuses that mean "accepted, not yet filled".
 *
 * With a real broker an order is submitted and filled separately: outside
 * market hours it simply queues, and the reconcile worker writes the fill in
 * later. The simulated path filled instantly, which is why nothing here used
 * to account for it.
 */
const pendingStatuses = new Set(["pending", "submitted", "partially_filled"]);

/** Re-fetch the server component's data on this cadence. */
const REFRESH_MS = 15_000;

export function TradeDesk({
  account,
  holdings,
  orders,
  quotes,
  fundingAccountId,
}: {
  account: BrokerageAccount | null;
  holdings: Holding[];
  orders: Order[];
  quotes: Quote[];
  fundingAccountId: string;
}) {
  const router = useRouter();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [symbol, setSymbol] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Minted when the form opens, not on submit — a double-click must not place
  // two orders. Same rule as the transfer form.
  const [idempotencyKey, setKey] = useState(() => crypto.randomUUID());

  /*
   * The only price data that exists.
   *
   * There is no quote endpoint — the contract has three brokerage paths and
   * none of them returns a price for a symbol you do not already hold. So the
   * last fill is the last price the system actually knows, and it is labelled
   * as exactly that rather than dressed up as a live market quote.
   */
  const lastPrice = useMemo(() => {
    const prices = new Map<string, { price: Money; at: string }>();
    // Orders arrive newest-first, so the first hit per symbol is the latest.
    for (const order of orders) {
      if (order.filledAvgPrice && !prices.has(order.symbol)) {
        prices.set(order.symbol, {
          price: order.filledAvgPrice,
          at: order.createdAt,
        });
      }
    }
    return prices;
  }, [orders]);

  // Poll for fills placed elsewhere. router.refresh() re-runs the server
  // component, so this shows real movement, not a simulated tick.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  const suggestions = useMemo(() => searchSymbols(symbol), [symbol]);
  const typed = symbol.trim().toUpperCase();
  const quote = lastPrice.get(typed);
  const marketQuote = quotes.find((entry) => entry.symbol === typed);

  const positions = holdings.map((holding) => {
    const price = lastPrice.get(holding.symbol)?.price;
    const value = price
      ? Math.round(holding.quantity * price.amount)
      : holding.costBasis.amount;
    return {
      ...holding,
      price,
      value: { amount: value, currency: "USD" } as Money,
      change: value - holding.costBasis.amount,
    };
  });

  const invested = positions.reduce((sum, p) => sum + p.costBasis.amount, 0);
  const marketValue = positions.reduce((sum, p) => sum + p.value.amount, 0);

  const submit = async () => {
    const parsed = Math.round(Number.parseFloat(amountInput || "0") * 100);
    if (!typed) {
      setError("Enter a symbol.");
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      // Opened on first order rather than up front: most people never trade,
      // and an account nobody asked for is a row nobody wanted.
      if (!account) await brokerageApi.open(fundingAccountId);

      await brokerageApi.placeOrder(
        { side, symbol: typed, amount: { amount: parsed, currency: "USD" } },
        idempotencyKey,
      );

      setAmountInput("");
      setSymbol("");
      setKey(crypto.randomUUID());
      router.refresh();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Market value"
          value={{ amount: marketValue, currency: "USD" }}
          caption={`${positions.length} position${positions.length === 1 ? "" : "s"}`}
        />
        <StatTile
          label="Invested"
          value={{ amount: invested, currency: "USD" }}
          caption="Total cost basis"
        />
        <StatTile
          label="Cash to invest"
          value={account?.cashBalance ?? { amount: 0, currency: "USD" }}
          caption={account ? "Settled" : "Opens with your first order"}
        />
      </div>

      <MarketPanel holdings={holdings} quotes={quotes} onPick={setSymbol} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Place an order</CardTitle>
        </CardHeader>
        <CardBody>
          <div
            role="group"
            aria-label="Buy or sell"
            className="mb-4 inline-flex rounded-pill border border-border p-0.5"
          >
            {(["buy", "sell"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSide(option)}
                aria-pressed={side === option}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-pill px-4 text-sm font-medium capitalize transition-colors",
                  side === option
                    ? "bg-accent-soft text-accent"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {option === "buy" ? (
                  <TrendingUp className="size-3.5" aria-hidden />
                ) : (
                  <TrendingDown className="size-3.5" aria-hidden />
                )}
                {option}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Symbol</span>
              {/* Native datalist: type-ahead, keyboard support and screen
                  reader behaviour for free, and no combobox to maintain. Free
                  text still submits — the list is a convenience, not a gate. */}
              <input
                value={symbol}
                onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                list="symbol-options"
                placeholder="Any ticker"
                maxLength={10}
                autoComplete="off"
                className="h-11 w-52 rounded-field border border-border-strong bg-surface px-3 text-sm uppercase text-ink"
              />
              <datalist id="symbol-options">
                {suggestions.map((entry) => (
                  <option key={entry.symbol} value={entry.symbol}>
                    {entry.name}
                  </option>
                ))}
              </datalist>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Amount</span>
              <input
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                inputMode="decimal"
                placeholder="100.00"
                className="h-11 w-36 rounded-field border border-border-strong bg-surface px-3 text-sm tabular text-ink"
              />
            </label>

            <Button onClick={submit} disabled={busy}>
              {busy ? "Placing…" : side === "buy" ? "Buy" : "Sell"}
            </Button>
          </div>

          {typed && (
            <p className="mt-3 text-sm text-ink-muted">
              <span className="font-medium text-ink">{typed}</span>
              {nameFor(typed) && ` · ${nameFor(typed)}`}
              {marketQuote && (
                <>
                  {" · market "}
                  <span className="tabular text-ink">
                    {marketQuote.price.toLocaleString("en-US", {
                      style: "currency",
                      currency: marketQuote.currency,
                    })}
                  </span>
                </>
              )}
              {quote ? (
                <>
                  {" · your last fill "}
                  <Amount value={quote.price} />
                </>
              ) : (
                " · no fill yet"
              )}
            </p>
          )}

          <p className="mt-2 text-xs text-ink-muted">
            A dollar amount, not a share count — fractional shares are bought to
            match.
          </p>

          {error && (
            <p role="alert" className="mt-3 text-sm text-alert">
              {error}
            </p>
          )}
        </CardBody>
      </Card>

      <section aria-labelledby="positions-heading" className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="positions-heading"
            className="font-display text-xl font-semibold text-ink"
          >
            Positions
          </h2>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-1.5 rounded-field text-sm font-medium text-accent hover:underline"
          >
            <RotateCw className="size-3.5" aria-hidden />
            Refresh
          </button>
        </div>

        <Card>
          {positions.length === 0 ? (
            <CardBody className="pt-5">
              <p className="text-sm text-ink-muted">
                Nothing held yet. A position appears once an order fills —
                which is not always immediate, see below.
              </p>
            </CardBody>
          ) : (
            <ul className="divide-y divide-border">
              {positions.map((position) => (
                <li
                  key={position.symbol}
                  className="flex items-baseline justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {position.symbol}
                      {nameFor(position.symbol) && (
                        <span className="ml-2 text-xs font-normal text-ink-subtle">
                          {nameFor(position.symbol)}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-subtle">
                      {position.quantity.toFixed(4)} shares · avg{" "}
                      <Amount value={position.averageCost} />
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Amount
                      value={position.value}
                      className="text-sm font-medium"
                    />
                    <p
                      className={cn(
                        "mt-0.5 text-xs tabular",
                        position.change > 0 && "text-positive",
                        position.change < 0 && "text-negative",
                        position.change === 0 && "text-ink-subtle",
                      )}
                    >
                      {position.change === 0
                        ? "flat"
                        : `${position.change > 0 ? "+" : "−"}$${(
                            Math.abs(position.change) / 100
                          ).toFixed(2)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <p className="mt-2 text-xs text-ink-subtle">
          Valued at your last fill price, not a live quote.
        </p>
      </section>

      <section aria-labelledby="orders-heading">
        <h2
          id="orders-heading"
          className="mb-3 font-display text-xl font-semibold text-ink"
        >
          Orders
        </h2>
        <Card>
          {orders.length === 0 ? (
            <CardBody className="pt-5">
              <p className="text-sm text-ink-muted">No orders yet.</p>
            </CardBody>
          ) : (
            <ul className="divide-y divide-border">
              {orders.map((order) => (
                <li key={order.id} className="px-5 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm text-ink">
                      <span className="font-medium capitalize">
                        {order.side}
                      </span>{" "}
                      {order.symbol}
                      <span className="ml-2 text-xs text-ink-subtle">
                        {order.status}
                      </span>
                    </p>
                    {order.notional && (
                      <Amount value={order.notional} className="text-sm" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    {formatFullDate(order.createdAt)}
                    {order.filledAvgPrice ? (
                      <>
                        {" · filled at "}
                        <Amount value={order.filledAvgPrice} />
                      </>
                    ) : (
                      pendingStatuses.has(order.status) &&
                      " · waiting for the market — it fills when trading opens"
                    )}
                  </p>
                  {order.failureReason && (
                    <p className="mt-1 text-xs text-alert">
                      {order.failureReason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </>
  );
}
