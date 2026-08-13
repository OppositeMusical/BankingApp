import { apiFetch } from "../client";
import { z } from "zod";
import { CardSchema, listOf, oneOf } from "../wire";
import { resolve, withLatency } from "./resolve";
import { cards as cardFixtures } from "@/lib/mock/data";
import type { Card } from "@/lib/types/banking";

/* Cards.  ⇄  openapi.yaml #/paths/~1cards */

const CardsResponse = listOf("cards", CardSchema);
const CardResponse = oneOf("card", CardSchema);

type WireCard = z.infer<typeof CardSchema>;

const toCard = (wire: WireCard): Card => {
  // controls is an open object in the contract; only the fields we render are
  // read, and a missing or oddly-typed one is simply not shown.
  const perTransaction = wire.controls?.perTransactionLimit;
  return {
    id: wire.id,
    accountId: wire.accountId,
    label: wire.isVirtual === false ? "Physical card" : "Virtual card",
    last4: wire.last4,
    status: wire.status === "frozen" ? "frozen" : "active",
    // No expiry on the wire; the UI only ever prints it.
    expiry: "—",
    virtual: wire.isVirtual ?? true,
    limit:
      typeof perTransaction === "number"
        ? { amount: perTransaction, currency: "USD" }
        : undefined,
  };
};

export const cardsApi = {
  issue: (accountId: string, subAccountId?: string): Promise<Card | undefined> =>
    resolve("cards.create", {
      scopedTo: accountId,
      live: async () => {
        const { card } = await apiFetch("/cards", {
          method: "POST",
          body: { accountId, subAccountId, type: "debit" },
          schema: CardResponse,
        });
        return toCard(card);
      },
      fixture: () => undefined,
      empty: () => undefined,
    }),

  list: (): Promise<Card[]> =>
    resolve("cards.list", {
      live: async () => {
        const { cards } = await apiFetch("/cards", { schema: CardsResponse });
        return cards.map(toCard);
      },
      fixture: () => withLatency(cardFixtures),
      empty: () => [],
    }),

  setFrozen: (id: string, frozen: boolean): Promise<Card | undefined> =>
    resolve("cards.update", {
      scopedTo: id,
      live: async () => {
        const { card } = await apiFetch(`/cards/${id}`, {
          method: "PATCH",
          body: { status: frozen ? "frozen" : "active" },
          schema: CardResponse,
        });
        return toCard(card);
      },
      fixture: () => undefined,
      empty: () => undefined,
    }),
};
