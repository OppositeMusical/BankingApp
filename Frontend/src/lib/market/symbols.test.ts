import { describe, expect, it } from "vitest";
import { nameFor, searchSymbols } from "./symbols";

describe("searchSymbols", () => {
  it("puts symbol-prefix matches first", () => {
    // "V" matches Visa (symbol) and several names; the ticker wins.
    expect(searchSymbols("V")[0].symbol).toBe("V");
  });

  it("matches on company name too", () => {
    expect(searchSymbols("apple").map((s) => s.symbol)).toContain("AAPL");
  });

  it("is case insensitive", () => {
    expect(searchSymbols("nvda")[0].symbol).toBe("NVDA");
  });

  it("returns a default list for an empty query", () => {
    expect(searchSymbols("").length).toBeGreaterThan(0);
  });

  it("returns nothing for a symbol it has never heard of", () => {
    expect(searchSymbols("zzzzz")).toEqual([]);
  });

  it("resolves names case-insensitively", () => {
    expect(nameFor("voo")).toBe("Vanguard S&P 500 ETF");
    expect(nameFor("NOPE")).toBeUndefined();
  });
});
