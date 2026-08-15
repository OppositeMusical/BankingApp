"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { PriceChart } from "@/components/charts/price-chart";
import { Sparkline } from "@/components/charts/sparkline";
import type { Quote } from "@/lib/market/quotes";
import { cn } from "@/lib/utils/cn";

/**
 * Search the whole market, in a dialog.
 *
 * Native <dialog> rather than a hand-rolled overlay: focus trapping, Esc to
 * close, inertness of the page behind it and the backdrop all come for free
 * and are the parts people usually get wrong.
 *
 * It carries its OWN chart. The page behind shows the account's holdings, and
 * overwriting that with whatever was typed into a search box would lose the
 * thing someone came to the page for.
 */
const DEBOUNCE_MS = 250;

export function StockSearchDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  /** Puts the symbol into the order form on the page behind. */
  onPick: (symbol: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Quote[]>([]);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const run = useRef(0);

  // showModal() is what makes it modal — the `open` attribute alone renders a
  // non-modal dialog with no backdrop and no focus trap.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const id = ++run.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/market?q=${encodeURIComponent(trimmed)}&range=1mo`,
        );
        const data = (await response.json()) as { quotes: Quote[] };
        // A slow early response must not overwrite a fast later one.
        if (id === run.current) {
          setResults(data.quotes);
          setSelected(data.quotes[0] ?? null);
        }
      } catch {
        if (id === run.current) setResults([]);
      } finally {
        if (id === run.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Clicking the backdrop closes. The backdrop IS the dialog element, so
      // the target check is what tells it apart from a click on the content.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="w-[min(48rem,92vw)] rounded-card border border-border bg-surface p-0 text-ink backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Search className="size-4 shrink-0 text-ink-subtle" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search any stock, ETF or fund"
          aria-label="Search stocks"
          className="h-9 flex-1 bg-transparent text-sm text-ink outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-9 items-center justify-center rounded-pill text-ink-muted hover:bg-surface-sunk hover:text-ink"
        >
          <X className="size-4" aria-hidden />
          <span className="sr-only">Close search</span>
        </button>
      </div>

      {selected && (
        <div className="border-b border-border p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-lg font-semibold text-ink">
              {selected.symbol}
              {selected.name && (
                <span className="ml-2 text-sm font-normal text-ink-subtle">
                  {selected.name}
                </span>
              )}
            </p>
            <p className="flex items-baseline gap-2">
              <span className="font-numbers text-lg font-semibold tabular text-ink">
                {selected.price.toLocaleString("en-US", {
                  style: "currency",
                  currency: selected.currency,
                })}
              </span>
              <Change percent={selected.changePercent} />
            </p>
          </div>
          <PriceChart quote={selected} height={140} />
        </div>
      )}

      <div className="max-h-72 overflow-y-auto">
        {query.trim() === "" ? (
          <p className="p-6 text-center text-sm text-ink-muted">
            Type a ticker or a company name.
          </p>
        ) : results.length === 0 && !loading ? (
          <p className="p-6 text-center text-sm text-ink-muted">
            Nothing found for &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <ul className={cn("divide-y divide-border", loading && "opacity-60")}>
            {results.map((quote) => (
              <li key={quote.symbol}>
                <button
                  type="button"
                  onClick={() => setSelected(quote)}
                  onDoubleClick={() => {
                    onPick(quote.symbol);
                    onClose();
                  }}
                  aria-current={selected?.symbol === quote.symbol || undefined}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-sunk",
                    selected?.symbol === quote.symbol && "bg-accent-soft/40",
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
                    <Change percent={quote.changePercent} compact />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="flex items-center justify-between gap-3 border-t border-border p-4">
          <p className="text-xs text-ink-subtle">
            Real market data. Orders fill at the broker&apos;s price.
          </p>
          <button
            type="button"
            onClick={() => {
              onPick(selected.symbol);
              onClose();
            }}
            className="inline-flex h-10 items-center rounded-field bg-accent px-4 text-sm font-medium text-accent-on hover:bg-accent-hover"
          >
            Trade {selected.symbol}
          </button>
        </div>
      )}
    </dialog>
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
  return (
    <span
      className={cn(
        "tabular",
        compact ? "block text-xs" : "text-sm font-medium",
        rising ? "text-positive" : "text-negative",
      )}
    >
      {rising ? "+" : "−"}
      {Math.abs(percent).toFixed(2)}%
    </span>
  );
}
