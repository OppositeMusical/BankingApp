import { z } from "zod";
import { apiFetch } from "../client";
import { listOf } from "../wire";
import { resolve } from "./resolve";

/*
 * Linked external accounts, via Plaid.  ⇄  openapi.yaml #/paths/~1linked-accounts
 *
 * These are READ-ONLY observations of accounts at other banks. Nothing here
 * moves money — a linked account tells us a paycheck landed at the customer's
 * other bank, which fires a rule, which moves OUR money on OUR ledger. The
 * backend is explicit that conflating the two would let a balance at Chase
 * inflate a balance here, and the UI copy follows the same line.
 */

const LinkedAccountSchema = z.object({
  id: z.string(),
  accountId: z.string().nullable().optional(),
  institutionName: z.string().nullable().optional(),
  accountName: z.string().nullable().optional(),
  mask: z.string().nullable().optional(),
  subtype: z.string().nullable().optional(),
  status: z.enum(["active", "login_required", "disconnected", "error"]),
  lastSyncedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

const LinkTokenSchema = z.object({
  linkToken: z.string(),
  simulated: z.boolean().optional(),
});

export type LinkedAccount = {
  id: string;
  institution?: string;
  name?: string;
  mask?: string;
  subtype?: string;
  status: "active" | "login_required" | "disconnected" | "error";
  lastSyncedAt?: string;
};

const toLinked = (
  wire: z.infer<typeof LinkedAccountSchema>,
): LinkedAccount => ({
  id: wire.id,
  institution: wire.institutionName ?? undefined,
  name: wire.accountName ?? undefined,
  mask: wire.mask ?? undefined,
  subtype: wire.subtype ?? undefined,
  status: wire.status,
  lastSyncedAt: wire.lastSyncedAt ?? undefined,
});

export const linkedApi = {
  list: (): Promise<LinkedAccount[]> =>
    resolve("linkedAccounts.list", {
      live: async () => {
        const { linkedAccounts } = await apiFetch("/linked-accounts", {
          schema: listOf("linkedAccounts", LinkedAccountSchema),
        });
        return linkedAccounts.map(toLinked);
      },
      fixture: () => [],
      empty: () => [],
    }),

  /** Starts the flow. The token is short-lived and single-use. */
  linkToken: (): Promise<{ linkToken: string; simulated: boolean }> =>
    resolve("linkedAccounts.list", {
      live: async () => {
        const data = await apiFetch("/linked-accounts/link-token", {
          method: "POST",
          body: {},
          schema: LinkTokenSchema,
        });
        return { linkToken: data.linkToken, simulated: data.simulated ?? false };
      },
      fixture: () => {
        throw new Error("Linking a bank needs the live API.");
      },
      empty: () => {
        throw new Error("Linking a bank is not available yet.");
      },
    }),

  /**
   * Finishes the flow.
   *
   * `accountId` is optional and associates the link with one of our accounts,
   * so a detected deposit knows which account a rule should act on.
   */
  exchange: (
    publicToken: string,
    accountId?: string,
  ): Promise<LinkedAccount[]> =>
    resolve("linkedAccounts.list", {
      live: async () => {
        const { linkedAccounts } = await apiFetch("/linked-accounts/exchange", {
          method: "POST",
          body: { publicToken, accountId },
          schema: listOf("linkedAccounts", LinkedAccountSchema),
        });
        return linkedAccounts.map(toLinked);
      },
      fixture: () => [],
      empty: () => [],
    }),

  sync: (id: string): Promise<void> =>
    resolve("linkedAccounts.list", {
      live: async () => {
        await apiFetch(`/linked-accounts/${id}/sync`, { method: "POST" });
      },
      fixture: () => undefined,
      empty: () => undefined,
    }),

  unlink: (id: string): Promise<void> =>
    resolve("linkedAccounts.list", {
      live: async () => {
        await apiFetch(`/linked-accounts/${id}`, { method: "DELETE" });
      },
      fixture: () => undefined,
      empty: () => undefined,
    }),
};
