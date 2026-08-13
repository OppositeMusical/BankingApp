"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, TrendingDown, TrendingUp } from "lucide-react";
import { PriceChart } from "@/components/charts/price-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { Card, CardBody } from "@/components/ui/card";
import { searchSymbols } from "@/lib/market/symbols";
import type { Quote, Range } from "@/lib/market/quotes";
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

/** How long to wait after a keystroke before asking upstream. */
const DEBOUNCE_MS = 250;

export function MarketPanel({
  initialQuotes,
  onPick,
}: {
  initialQuotes: Quote[];
  /** Fills the order form when a row is chosen. */
  onPick?: (symbol: string) => void;
}) {
  const [query, setQuery] = useState("");
  // Only search results are stored; the default list is derived, so there is
  // no effect writing state just to copy a prop back into it.
  const [results, setResults] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(
    initialQuotes[0]?.symbol ?? null,
  );
  const [range, setRange] = useState<Range>("1mo");
  const [detail, setDetail] = useState<Quote | null>(initialQuotes[0] ?? null);

  // Every fetch is tagged; a slow early response must not overwrite a fast
  // later one. Without this, typing "A" then "AAPL" can leave A's results on
  // screen.
  const listRun = useRef(0);
  const detailRun = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const run = ++listRun.current;
    const timer = setTimeout(async () => {
      // Match the local catalogue first, then fall back to treating the input
      // as a ticker — so a symbol not on the list is still reachable.
      const matches = searchSymbols(trimmed, 8).map((entry) => entry.symbol);
      const symbols = matches.length > 0 ? matches : [trimmed.toUpperCase()];

      setLoading(true);
      try {
        const response = await fetch(
          `/api/market?symbols=${symbols.join(",")}&range=1mo`,
        );
        const data = (await response.json()) as { quotes: Quote[] };
        if (run === listRun.current) setResults(data.quotes);
      } catch {
        if (run === listRun.current) setResults([]);
      } finally {
        if (run === listRun.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!selected) return;
    const run = ++detailRun.current;
    (async () => {
      try {
        const response = await fetch(
          `/api/market?symbols=${selected}&range=${range}`,
        );
        const data = (await response.json()) as { quotes: Quote[] };
        if (run === detailRun.current) setDetail(data.quotes[0] ?? null);
      } catch {
        /* keep the last good chart rather than blanking it */
      }
    })();
  }, [selected, range]);

  const searching = query.trim().length > 0;
  const rows = searching ? results : initialQuotes;
  const empty = searching && !loading && rows.length === 0;
  const heading = useMemo(
    () => (query.trim() ? "Results" : "Markets"),
    [query],
  );

  return (
    <>
      {detail && (
        <Card className="mb-6">
          <CardBody className="pt-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-semibold text-ink">
                  {detail.symbol}
                  {detail.name && (
                    <span className="ml-2 text-sm font-normal text-ink-subtle">
                      {detail.name}
                    </span>
                  )}
                </p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-xl font-semibold tabular text-ink">
                    {detail.price.toLocaleString("en-US", {
                      style: "currency",
                      currency: detail.currency,
                    })}
                  </span>
                  <ChangeBadge percent={detail.changePercent} />
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

            <PriceChart quote={detail} />
          </CardBody>
        </Card>
      )}

      <section aria-labelledby="market-heading" className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="market-heading"
            className="font-display text-xl font-semibold text-ink"
          >
            {heading}
          </h2>
          <label className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a ticker or company"
              aria-label="Search stocks"
              className="h-10 w-64 rounded-field border border-border-strong bg-surface pl-9 pr-3 text-sm text-ink"
            />
          </label>
        </div>

        <Card>
          {empty ? (
            <CardBody className="pt-5">
              <p className="text-sm text-ink-muted">
                Nothing found for &ldquo;{query.trim()}&rdquo;.
              </p>
            </CardBody>
          ) : (
            <ul className={cn("divide-y divide-border", loading && "opacity-60")}>
              {rows.map((quote) => (
                <li key={quote.symbol}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(quote.symbol);
                      onPick?.(quote.symbol);
                    }}
                    aria-current={selected === quote.symbol || undefined}
                    className={cn(
                      "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-sunk",
                      selected === quote.symbol && "bg-accent-soft/40",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-ink">
                        {quote.symbol}
                      </span>
                      {quote.name && (
                        <span className="block truncate text-xs text-ink-subtle">
                          {quote.name}
                        </span>
                      )}
                    </span>

                    <Sparkline points={quote.points} className="shrink-0" />

                    <span className="w-24 shrink-0 text-right">
                      <span className="block text-sm tabular text-ink">
                        {quote.price.toLocaleString("en-US", {
                          style: "currency",
                          currency: quote.currency,
                        })}
                      </span>
                      <ChangeBadge percent={quote.changePercent} compact />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <p className="mt-2 text-xs text-ink-subtle">
          Real market data, cached for a minute. Orders still fill at the
          sandbox&apos;s own price — these quotes are for looking, not for
          pricing a trade.
        </p>
      </section>
    </>
  );
}

function ChangeBadge({
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
        compact ? "text-xs" : "text-sm font-medium",
        rising ? "text-positive" : "text-negative",
      )}
    >
      {!compact && <Icon className="size-3.5" aria-hidden />}
      {rising ? "+" : "−"}
      {Math.abs(percent).toFixed(2)}%
    </span>
  );
}
