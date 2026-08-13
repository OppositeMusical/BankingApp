import { NextResponse, type NextRequest } from "next/server";
import { fetchQuotes, searchMarket, type Range } from "@/lib/market/quotes";

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

  const rangeFor = (raw: string | null): Range =>
    raw && ranges.has(raw as Range) ? (raw as Range) : "1mo";

  // ?q= searches the whole market and quotes the hits in one round trip, so a
  // keystroke costs the client one request rather than search-then-quote.
  const query = params.get("q");
  if (query !== null) {
    const hits = await searchMarket(query, MAX_SYMBOLS);
    if (hits.length === 0) return NextResponse.json({ quotes: [] });

    const quotes = await fetchQuotes(
      hits.map((hit) => hit.symbol),
      rangeFor(params.get("range")),
    );
    // Yahoo's search knows names the chart endpoint does not return.
    const names = new Map(hits.map((hit) => [hit.symbol, hit.name]));
    return NextResponse.json({
      quotes: quotes.map((quote) => ({
        ...quote,
        name: quote.name ?? names.get(quote.symbol),
      })),
    });
  }

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

  const quotes = await fetchQuotes(symbols, rangeFor(params.get("range")));
  return NextResponse.json({ quotes });
}
