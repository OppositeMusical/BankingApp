"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { StatTile } from "@/components/banking/stat-tile";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { brokerageApi, describeError } from "@/lib/api";
import { formatFullDate } from "@/lib/format/date";
import type {
  BrokerageAccount,
  Holding,
  Order,
} from "@/lib/api/endpoints/brokerage";
import { cn } from "@/lib/utils/cn";

export function TradeDesk({
  account,
  holdings,
  orders,
  fundingAccountId,
}: {
  account: BrokerageAccount | null;
  holdings: Holding[];
  orders: Order[];
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

  const submit = async () => {
    const parsed = Math.round(Number.parseFloat(amountInput || "0") * 100);
    if (!symbol.trim()) {
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
      // The brokerage account is opened on first order rather than up front:
      // most people never trade, and an account nobody asked for is a row
      // nobody wanted.
      if (!account) await brokerageApi.open(fundingAccountId);

      await brokerageApi.placeOrder(
        {
          side,
          symbol: symbol.trim().toUpperCase(),
          amount: { amount: parsed, currency: "USD" },
        },
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

  const invested = holdings.reduce((sum, h) => sum + h.costBasis.amount, 0);

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <StatTile
          label="Invested"
          value={{ amount: invested, currency: "USD" }}
          caption={`${holdings.length} position${holdings.length === 1 ? "" : "s"}`}
        />
        <StatTile
          label="Brokerage cash"
          value={account?.cashBalance ?? { amount: 0, currency: "USD" }}
          caption={account ? "Settled" : "Opens with your first order"}
        />
      </div>

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
              <input
                value={symbol}
                onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                placeholder="VOO"
                maxLength={10}
                className="h-11 w-32 rounded-field border border-border-strong bg-surface px-3 text-sm uppercase text-ink"
              />
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

          <p className="mt-3 text-xs text-ink-muted">
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

      <section aria-labelledby="holdings-heading" className="mb-6">
        <h2
          id="holdings-heading"
          className="mb-3 font-display text-xl font-semibold text-ink"
        >
          Holdings
        </h2>
        <Card>
          {holdings.length === 0 ? (
            <CardBody className="pt-5">
              <p className="text-sm text-ink-muted">
                Nothing held yet. A buy shows up here straight away.
              </p>
            </CardBody>
          ) : (
            <ul className="divide-y divide-border">
              {holdings.map((holding) => (
                <li
                  key={holding.symbol}
                  className="flex items-baseline justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{holding.symbol}</p>
                    <p className="mt-0.5 text-xs text-ink-subtle">
                      {holding.quantity.toFixed(4)} shares · avg{" "}
                      <Amount value={holding.averageCost} />
                    </p>
                  </div>
                  <Amount
                    value={holding.costBasis}
                    className="text-sm font-medium"
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
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
                    {order.filledAvgPrice && (
                      <>
                        {" · filled at "}
                        <Amount value={order.filledAvgPrice} />
                      </>
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
