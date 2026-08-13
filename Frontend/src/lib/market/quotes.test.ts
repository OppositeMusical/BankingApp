import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchQuote } from "./quotes";

const chart = (over: Record<string, unknown> = {}) => ({
  chart: {
    result: [
      {
        meta: {
          symbol: "AAPL",
          regularMarketPrice: 110,
          chartPreviousClose: 100,
          currency: "USD",
        },
        timestamp: [1, 2, 3, 4],
        // A null close is a gap Yahoo pads; it must not become a point.
        indicators: { quote: [{ close: [100, null, 105, 110] }] },
        ...over,
      },
    ],
  },
});

const mockFetch = (payload: unknown, ok = true) =>
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok,
    json: async () => payload,
  }));

afterEach(() => vi.unstubAllGlobals());

describe("fetchQuote", () => {
  it("computes change against the previous close", async () => {
    mockFetch(chart());
    const quote = await fetchQuote("AAPL");
    expect(quote?.change).toBe(10);
    expect(quote?.changePercent).toBeCloseTo(10);
  });

  it("drops null closes and keeps timestamps aligned", async () => {
    mockFetch(chart());
    const quote = await fetchQuote("AAPL");
    expect(quote?.points).toEqual([100, 105, 110]);
    expect(quote?.times).toEqual([1, 3, 4]);
  });

  it("returns null on a non-ok response rather than throwing", async () => {
    mockFetch({}, false);
    expect(await fetchQuote("AAPL")).toBeNull();
  });

  it("returns null when the network fails — a market outage must not take a banking screen down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await fetchQuote("AAPL")).toBeNull();
  });

  it("returns null when the payload has no price", async () => {
    mockFetch({ chart: { result: [{ meta: {} }] } });
    expect(await fetchQuote("AAPL")).toBeNull();
  });

  it("survives a zero previous close without dividing by zero", async () => {
    mockFetch(chart({ meta: { symbol: "X", regularMarketPrice: 5, chartPreviousClose: 0 } }));
    const quote = await fetchQuote("X");
    expect(Number.isFinite(quote!.changePercent)).toBe(true);
  });
});
