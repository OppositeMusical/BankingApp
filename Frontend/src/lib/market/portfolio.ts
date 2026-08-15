import type { Quote } from "./quotes";

/**
 * The account's holdings, valued back through time.
 *
 * IMPORTANT, and stated on the chart itself: this uses TODAY'S quantities at
 * every point. It answers "what would what I hold now have been worth then",
 * not "what was my portfolio worth then" — those differ the moment anything
 * was bought or sold mid-period, and the backend publishes no position
 * history to compute the real one from.
 *
 * ponytail: swap for real position history the day /brokerage has one; the
 * chart takes a Quote either way, so only this function changes.
 */
export function portfolioSeries(
  holdings: { symbol: string; quantity: number }[],
  quotes: Quote[],
): Quote | null {
  const priced = holdings
    .map((holding) => ({
      holding,
      quote: quotes.find((quote) => quote.symbol === holding.symbol),
    }))
    .filter(
      (entry): entry is { holding: (typeof holdings)[number]; quote: Quote } =>
        Boolean(entry.quote) && entry.quote!.points.length > 1,
    );

  if (priced.length === 0) return null;

  // Series can differ in length when one symbol has a shorter history or a
  // different trading calendar. Align on the shortest from the RIGHT, so the
  // most recent points line up — truncating from the left would pair today's
  // price for one holding with last week's for another.
  const length = Math.min(...priced.map((entry) => entry.quote.points.length));
  const tail = <T,>(values: T[]) => values.slice(values.length - length);

  const points: number[] = [];
  for (let index = 0; index < length; index++) {
    let total = 0;
    for (const { holding, quote } of priced) {
      total += tail(quote.points)[index] * holding.quantity;
    }
    points.push(total);
  }

  const times = tail(priced[0].quote.times);
  const price = points[points.length - 1];
  const previousClose = points[0];

  return {
    symbol: "Portfolio",
    name: `${priced.length} holding${priced.length === 1 ? "" : "s"}`,
    price,
    previousClose,
    change: price - previousClose,
    changePercent: previousClose
      ? ((price - previousClose) / previousClose) * 100
      : 0,
    currency: priced[0].quote.currency,
    points,
    times,
  };
}
