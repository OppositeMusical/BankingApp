import { describe, expect, it } from "vitest";
import { portfolioSeries } from "./portfolio";
import type { Quote } from "./quotes";

const quote = (symbol: string, points: number[], times?: number[]): Quote => ({
  symbol,
  price: points[points.length - 1],
  previousClose: points[0],
  change: 0,
  changePercent: 0,
  currency: "USD",
  points,
  times: times ?? points.map((_, i) => i),
});

describe("portfolioSeries", () => {
  it("sums holdings weighted by quantity", () => {
    const series = portfolioSeries(
      [{ symbol: "A", quantity: 2 }, { symbol: "B", quantity: 3 }],
      [quote("A", [10, 20]), quote("B", [1, 2])],
    );
    // t0: 2*10 + 3*1 = 23 ; t1: 2*20 + 3*2 = 46
    expect(series?.points).toEqual([23, 46]);
    expect(series?.price).toBe(46);
    expect(series?.changePercent).toBeCloseTo(100);
  });

  it("aligns unequal series from the RIGHT so today lines up with today", () => {
    const series = portfolioSeries(
      [{ symbol: "A", quantity: 1 }, { symbol: "B", quantity: 1 }],
      [quote("A", [1, 2, 3]), quote("B", [10, 20])],
    );
    // A's tail is [2,3], not [1,2] — pairing today's B with A's oldest point
    // would invent a move that never happened.
    expect(series?.points).toEqual([12, 23]);
  });

  it("ignores holdings with no quote", () => {
    const series = portfolioSeries(
      [{ symbol: "A", quantity: 1 }, { symbol: "GONE", quantity: 5 }],
      [quote("A", [5, 6])],
    );
    expect(series?.points).toEqual([5, 6]);
    expect(series?.name).toBe("1 holding");
  });

  it("returns null when nothing is held", () => {
    expect(portfolioSeries([], [quote("A", [1, 2])])).toBeNull();
  });

  it("returns null when no holding has usable history", () => {
    expect(
      portfolioSeries([{ symbol: "A", quantity: 1 }], [quote("A", [5])]),
    ).toBeNull();
  });

  it("survives a zero opening value without dividing by zero", () => {
    const series = portfolioSeries(
      [{ symbol: "A", quantity: 1 }],
      [quote("A", [0, 5])],
    );
    expect(Number.isFinite(series!.changePercent)).toBe(true);
  });
});
