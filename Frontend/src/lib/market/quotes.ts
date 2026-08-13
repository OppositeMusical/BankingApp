import { nameFor } from "./symbols";

/*
 * Market data.
 *
 * Yahoo's chart endpoint: no key, no signup, and it returns the quote and the
 * price history in one call — so a sparkline costs the same request as the
 * price beside it.
 *
 * Server-only, and deliberately so. The browser never calls Yahoo directly:
 * that would need CORS we do not control, and it would put a third-party host
 * in the page's request log next to the banking session. Everything goes
 * through our own route, same-origin.
 *
 * ponytail: unofficial endpoint, no SLA. If it starts failing, swap the URL and
 * the parse in `fetchQuote` — nothing above this file knows where prices come
 * from. A keyed provider (Finnhub, Twelve Data) drops into the same shape.
 */

export type Range = "1d" | "5d" | "1mo" | "6mo" | "1y" | "5y";

/** Interval per range, so a chart has ~30–250 points rather than 20k. */
const intervals: Record<Range, string> = {
  "1d": "5m",
  "5d": "30m",
  "1mo": "1d",
  "6mo": "1d",
  "1y": "1wk",
  "5y": "1mo",
};

export type Quote = {
  symbol: string;
  name?: string;
  /** Major units (dollars), not minor — this is display data, never ledger money. */
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
  /** Closing prices oldest → newest. Empty when the provider returned none. */
  points: number[];
  /** Unix seconds, parallel to `points`. */
  times: number[];
};

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        currency?: string;
      };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
    error?: unknown;
  };
};

export async function fetchQuote(
  symbol: string,
  range: Range = "1mo",
): Promise<Quote | null> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?range=${range}&interval=${intervals[range]}`;

  let payload: YahooChart;
  try {
    const response = await fetch(url, {
      // Yahoo 429s a bare fetch. This is not evasion — it is the same header a
      // browser would send, and the endpoint is public.
      headers: { "User-Agent": "Mozilla/5.0" },
      // Quotes are worth re-fetching, but not on every render. 60s is well
      // inside the staleness anyone would notice on a positions screen.
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    payload = (await response.json()) as YahooChart;
  } catch {
    // A market data outage must not take a banking screen down.
    return null;
  }

  const result = payload.chart?.result?.[0];
  const meta = result?.meta;
  if (!result || !meta?.regularMarketPrice) return null;

  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const stamps = result.timestamp ?? [];

  // Yahoo pads gaps with null. Drop them in step with their timestamps so the
  // line does not jump sideways.
  const points: number[] = [];
  const times: number[] = [];
  closes.forEach((close, index) => {
    if (typeof close === "number" && Number.isFinite(close)) {
      points.push(close);
      times.push(stamps[index] ?? 0);
    }
  });

  const price = meta.regularMarketPrice;
  const previousClose =
    meta.chartPreviousClose ?? meta.previousClose ?? points[0] ?? price;
  const change = price - previousClose;

  return {
    symbol: meta.symbol ?? symbol.toUpperCase(),
    name: nameFor(symbol),
    price,
    previousClose,
    change,
    changePercent: previousClose ? (change / previousClose) * 100 : 0,
    currency: meta.currency ?? "USD",
    points,
    times,
  };
}

/**
 * Several symbols at once.
 *
 * One request each, in parallel — Yahoo's batch endpoint needs a crumb/cookie
 * dance that is far more code than N small fetches, and the 60s cache means a
 * warm page makes none of them.
 */
export async function fetchQuotes(
  symbols: string[],
  range: Range = "1mo",
): Promise<Quote[]> {
  const settled = await Promise.all(
    symbols.map((symbol) => fetchQuote(symbol, range)),
  );
  return settled.filter((quote): quote is Quote => quote !== null);
}
