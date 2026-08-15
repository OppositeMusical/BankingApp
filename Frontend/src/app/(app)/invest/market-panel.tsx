"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, TrendingDown, TrendingUp } from "lucide-react";
import { PriceChart } from "@/components/charts/price-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { Card, CardBody } from "@/components/ui/card";
import { StockSearchDialog } from "./stock-search-dialog";
import { portfolioSeries } from "@/lib/market/portfolio";
import type { Quote, Range } from "@/lib/market/quotes";
import type { Holding } from "@/lib/api/endpoints/brokerage";
import { cn } from "@/lib/utils/cn";

const ranges: Range[] = ["1d", "5d", "1mo", "6mo", "1y", "5y"];

const rangeLabels: Record<Range, string> = {
  "1d": "1D",
  "5d": "5D",
  "1mo": "1M",
  "6mo": "6M",
  "1y": "1Y",
  "5y": "5Y",
};

/**
 * The account's portfolio: what it holds, charted, and nothing else.
 *
 * The list used to be padded out with a catalogue of well-known tickers, which
 * put stocks on screen the account had never touched and made a holding
 * indistinguishable from a suggestion. Anything not held or ordered now lives
 * behind the search dialog — which carries its own chart, so browsing cannot
 * overwrite the view of your own money.
 */
export function MarketPanel({
  holdings,
  quotes: initialQuotes,
  onPick,
}: {
  holdings: Holding[];
  /** Quotes for the held and ordered symbols, fetched on the server. */
  quotes: Quote[];
  /** Fills the order form when a row is chosen. */
  onPick?: (symbol: string) => void;
}) {
  const [range, setRange] = useState<Range>("1mo");
  const [quotes, setQuotes] = useState(initialQuotes);
  const [searchOpen, setSearchOpen] = useState(false);

  // The server rendered 1mo; any other range is a client concern.
  useEffect(() => {
    if (range === "1mo") return;
    const symbols = initialQuotes.map((quote) => quote.symbol);
    if (symbols.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/market?symbols=${symbols.join(",")}&range=${range}`,
        );
        const data = (await response.json()) as { quotes: Quote[] };
        if (!cancelled) setQuotes(data.quotes);
      } catch {
        /* keep the last good series rather than blanking the chart */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range, initialQuotes]);

  const shown = range === "1mo" ? initialQuotes : quotes;
  const portfolio = useMemo(
    () => portfolioSeries(holdings, shown),
    [holdings, shown],
  );

  return (
    <>
      <section aria-labelledby="portfolio-heading" className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="portfolio-heading"
            className="font-display text-xl font-semibold text-ink"
          >
            Your portfolio
          </h2>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-field border border-border-strong bg-surface px-3.5 text-sm font-medium text-ink hover:bg-surface-sunk"
          >
            <Search className="size-4" aria-hidden />
            Search stocks
          </button>
        </div>

        <Card>
          <CardBody className="pt-5">
            {portfolio ? (
              <>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-numbers text-2xl font-semibold tabular text-ink">
                      {portfolio.price.toLocaleString("en-US", {
                        style: "currency",
                        currency: portfolio.currency,
                      })}
                    </p>
                    <p className="mt-1 flex items-baseline gap-2 text-sm">
                      <Change percent={portfolio.changePercent} />
                      <span className="text-ink-subtle">
                        over {rangeLabels[range]}
                      </span>
                    </p>
                  </div>

                  <div
                    role="group"
                    aria-label="Chart range"
                    className="inline-flex rounded-pill border border-border p-0.5"
                  >
                    {ranges.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setRange(option)}
                        aria-pressed={range === option}
                        className={cn(
                          "inline-flex h-8 items-center rounded-pill px-2.5 text-xs font-medium transition-colors",
                          range === option
                            ? "bg-accent-soft text-accent"
                            : "text-ink-muted hover:text-ink",
                        )}
                      >
                        {rangeLabels[option]}
                      </button>
                    ))}
                  </div>
                </div>

                <PriceChart quote={portfolio} />

                <p className="mt-2 text-xs text-ink-subtle">
                  What you hold today, valued back through this period — not a
                  record of what the account was worth then. Position history
                  isn&apos;t published, so buys and sales part-way through
                  aren&apos;t reflected.
                </p>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-ink-muted">
                Nothing held yet. Search for a stock to place your first order,
                and this becomes a chart of what you own.
              </p>
            )}
          </CardBody>
        </Card>
      </section>

      {shown.length > 0 && (
        <section aria-labelledby="stocks-heading" className="mb-6">
          <h2
            id="stocks-heading"
            className="mb-3 font-display text-xl font-semibold text-ink"
          >
            Your stocks
          </h2>
          <Card>
            <ul className="divide-y divide-border">
              {shown.map((quote) => {
                const held = holdings.find(
                  (holding) => holding.symbol === quote.symbol,
                );
                return (
                  <li key={quote.symbol}>
                    <button
                      type="button"
                      onClick={() => onPick?.(quote.symbol)}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-sunk"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-ink">
                          {quote.symbol}
                        </span>
                        <span className="block truncate text-xs text-ink-subtle">
                          {held
                            ? `${held.quantity.toFixed(4)} shares`
                            : "Ordered, not filled yet"}
                        </span>
                      </span>
                      <Sparkline points={quote.points} className="shrink-0" />
                      <span className="w-24 shrink-0 text-right">
                        <span className="block text-sm tabular text-ink">
                          {quote.price.toLocaleString("en-US", {
                            style: "currency",
                            currency: quote.currency,
                          })}
                        </span>
                        <Change percent={quote.changePercent} compact />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      )}

      <StockSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPick={(symbol) => onPick?.(symbol)}
      />
    </>
  );
}

function Change({
  percent,
  compact = false,
}: {
  percent: number;
  compact?: boolean;
}) {
  const rising = percent >= 0;
  const Icon = rising ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular",
        compact ? "block text-xs" : "text-sm font-medium",
        rising ? "text-positive" : "text-negative",
      )}
    >
      {!compact && <Icon className="size-3.5" aria-hidden />}
      {rising ? "+" : "−"}
      {Math.abs(percent).toFixed(2)}%
    </span>
  );
}
