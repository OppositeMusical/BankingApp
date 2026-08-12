import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { isWireId, resolve } from "./resolve";
import * as config from "../config";

/*
 * These pin the rule that a fixture id must never reach the wire.
 *
 * Getting this wrong took the deployed dashboard down: the account list came
 * from fixtures (`acc_checking`) because sub-accounts are unimplemented, while
 * the implemented transactions endpoint sent that id to Go, which answered
 * "id must be a UUID" with a 400.
 */

describe("isWireId", () => {
  it("accepts a UUID", () => {
    expect(isWireId("30172bfa-6e88-4648-987d-3b942df3e6c5")).toBe(true);
  });

  it("rejects fixture slugs", () => {
    expect(isWireId("acc_checking")).toBe(false);
    expect(isWireId("flow_northwind")).toBe(false);
    expect(isWireId("")).toBe(false);
  });
});

describe("resolve", () => {
  beforeEach(() => vi.spyOn(config, "isLive").mockReturnValue(true));
  afterEach(() => vi.restoreAllMocks());

  const branches = () => ({
    live: vi.fn().mockResolvedValue("live"),
    fixture: vi.fn().mockReturnValue("fixture"),
  });

  it("goes live for a served operation with a wire id", async () => {
    const b = branches();
    const result = await resolve("accounts.transactions", {
      ...b,
      scopedTo: "30172bfa-6e88-4648-987d-3b942df3e6c5",
    });
    expect(result).toBe("live");
    expect(b.fixture).not.toHaveBeenCalled();
  });

  it("falls back to fixtures when the id is a fixture id", async () => {
    const b = branches();
    const result = await resolve("accounts.transactions", {
      ...b,
      scopedTo: "acc_checking",
    });
    expect(result).toBe("fixture");
    expect(b.live).not.toHaveBeenCalled();
  });

  it("falls back when any id in a set is a fixture id", async () => {
    const b = branches();
    const result = await resolve("accounts.transactions", {
      ...b,
      scopedTo: ["30172bfa-6e88-4648-987d-3b942df3e6c5", "acc_checking"],
    });
    expect(result).toBe("fixture");
    expect(b.live).not.toHaveBeenCalled();
  });

  it("uses fixtures for an unimplemented operation regardless of id", async () => {
    const b = branches();
    const result = await resolve("rules.list", {
      ...b,
      scopedTo: "30172bfa-6e88-4648-987d-3b942df3e6c5",
    });
    expect(result).toBe("fixture");
    expect(b.live).not.toHaveBeenCalled();
  });

  it("uses fixtures in mock mode even for a served operation", async () => {
    vi.spyOn(config, "isLive").mockReturnValue(false);
    const b = branches();
    const result = await resolve("accounts.transactions", {
      ...b,
      scopedTo: "30172bfa-6e88-4648-987d-3b942df3e6c5",
    });
    expect(result).toBe("fixture");
    expect(b.live).not.toHaveBeenCalled();
  });
});
