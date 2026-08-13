/**
 * Symbols offered in the trade form.
 *
 * A static list, because there is no symbol-search endpoint — the contract has
 * exactly three brokerage paths (account, orders, holdings) and none of them
 * takes a query. The sandbox will accept any string as a symbol, so this is a
 * convenience for picking a plausible one, not a whitelist.
 *
 * ponytail: replace with a real lookup the day the API grows one; the search
 * box already takes free text, so nothing above it has to change.
 */
export type Symbol = { symbol: string; name: string };

export const symbols: Symbol[] = [
  { symbol: "VOO", name: "Vanguard S&P 500 ETF" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
  { symbol: "SCHD", name: "Schwab US Dividend Equity ETF" },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "BRK.B", name: "Berkshire Hathaway" },
  { symbol: "JPM", name: "JPMorgan Chase" },
  { symbol: "V", name: "Visa" },
  { symbol: "JNJ", name: "Johnson & Johnson" },
  { symbol: "PG", name: "Procter & Gamble" },
  { symbol: "COST", name: "Costco" },
  { symbol: "DIS", name: "Walt Disney" },
  { symbol: "NFLX", name: "Netflix" },
];

const byName = (query: string) => (entry: Symbol) =>
  entry.symbol.toLowerCase().includes(query) ||
  entry.name.toLowerCase().includes(query);

/** Symbol-prefix matches first — that is what someone typing "AA" wants. */
export function searchSymbols(query: string, limit = 8): Symbol[] {
  const q = query.trim().toLowerCase();
  if (!q) return symbols.slice(0, limit);

  const matches = symbols.filter(byName(q));
  return matches
    .sort((a, b) => {
      const aStarts = a.symbol.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.symbol.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts || a.symbol.localeCompare(b.symbol);
    })
    .slice(0, limit);
}

export const nameFor = (symbol: string) =>
  symbols.find((entry) => entry.symbol === symbol.toUpperCase())?.name;
