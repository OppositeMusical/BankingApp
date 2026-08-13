import { NextResponse, type NextRequest } from "next/server";
import { fetchQuotes, type Range } from "@/lib/market/quotes";

/**
 * Same-origin market data, for search-as-you-type and range switching.
 *
 * Exists so the browser never talks to the data provider directly: no CORS we
 * do not control, and no third-party host appearing in the request log of a
 * page that also holds a banking session.
 *
 * Deliberately NOT under /api/[...path] — that route proxies to the banking
 * API and attaches the bearer token. Market data is public and must never
 * travel with a credential attached.
 */

const ranges = new Set<Range>(["1d", "5d", "1mo", "6mo", "1y", "5y"]);

/** Cap the fan-out: one page render should not fire fifty upstream requests. */
const MAX_SYMBOLS = 12;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const symbols = (params.get("symbols") ?? "")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    // Tickers only. This is interpolated into an upstream URL, so anything
    // that is not a plausible symbol is dropped rather than escaped.
    .filter((symbol) => /^[A-Z0-9.\-]{1,10}$/.test(symbol))
    .slice(0, MAX_SYMBOLS);

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  const rangeParam = params.get("range") as Range | null;
  const range = rangeParam && ranges.has(rangeParam) ? rangeParam : "1mo";

  const quotes = await fetchQuotes(symbols, range);
  return NextResponse.json({ quotes });
}
