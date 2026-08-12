import { describe, expect, it } from "vitest";
import { toAccount, toAccountShare } from "./account";
import type { WireMember, WireSubAccount } from "../wire";

const money = (amount: number) => ({
  amount,
  formatted: (amount / 100).toFixed(2),
  currency: "USD",
});

const subAccount = (overrides: Partial<WireSubAccount> = {}): WireSubAccount => ({
  id: "11111111-2222-3333-4444-555566667777",
  label: "Everyday",
  status: "active",
  createdAt: "2026-08-01T00:00:00Z",
  balance: {
    accountId: "acc_1",
    subAccountId: "sub_1",
    current: money(482_355),
    held: money(14_335),
    available: money(468_020),
  },
  ...overrides,
});

const member = (overrides: Partial<WireMember> = {}): WireMember => ({
  userId: "user_2",
  role: "member",
  name: "Daniel O.",
  ...overrides,
});

describe("toAccount", () => {
  it("maps a sub-account label to the account name", () => {
    expect(toAccount(subAccount()).name).toBe("Everyday");
  });

  it("takes balance from current and available, not held", () => {
    const account = toAccount(subAccount());
    expect(account.balance.amount).toBe(482_355);
    expect(account.available.amount).toBe(468_020);
  });

  it("drops the wire's formatted string", () => {
    const account = toAccount(subAccount());
    expect(account.balance).toEqual({ amount: 482_355, currency: "USD" });
  });

  it("is sole when nobody else has a role", () => {
    const account = toAccount(subAccount(), { members: [] });
    expect(account.visibility).toBe("sole");
    expect(account.sharedWith).toEqual([]);
  });

  it("is joint when someone else can act on it", () => {
    const account = toAccount(subAccount(), {
      members: [member({ role: "member" })],
    });
    expect(account.visibility).toBe("joint");
  });

  it("is viewable when others can only look", () => {
    const account = toAccount(subAccount(), {
      members: [member({ role: "viewer" })],
    });
    expect(account.visibility).toBe("viewable");
  });

  it("excludes the current user from sharedWith", () => {
    const account = toAccount(subAccount(), {
      members: [member({ userId: "me" }), member({ userId: "them" })],
      currentUserId: "me",
    });
    expect(account.sharedWith).toHaveLength(1);
    expect(account.sharedWith[0].personId).toBe("them");
  });

  it("infers kind from the label", () => {
    expect(toAccount(subAccount({ label: "Safety Net" })).kind).toBe("savings");
    expect(toAccount(subAccount({ label: "Everyday" })).kind).toBe("checking");
    expect(toAccount(subAccount({ label: "Career break fund" })).kind).toBe("goal");
  });

  it("survives a sub-account with no balance attached", () => {
    const account = toAccount(subAccount({ balance: undefined }));
    expect(account.balance.amount).toBe(0);
    expect(account.available.amount).toBe(0);
  });
});

describe("toAccountShare", () => {
  it("maps dependent to view — it cannot transfer", () => {
    expect(toAccountShare(member({ role: "dependent" })).access).toBe("view");
  });

  it("maps owner to manage", () => {
    expect(toAccountShare(member({ role: "owner" })).access).toBe("manage");
  });

  it("falls back to the email when no name is set", () => {
    const share = toAccountShare(
      member({ name: null, email: "d@example.com" }),
    );
    expect(share.name).toBe("d@example.com");
  });
});
