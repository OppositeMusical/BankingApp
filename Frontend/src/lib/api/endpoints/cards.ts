import { apiFetch } from "../client";
import { CardSchema, listOf, oneOf } from "../wire";
import { resolve, withLatency } from "./resolve";
import { cards as cardFixtures } from "@/lib/mock/data";
import type { Card } from "@/lib/types/banking";

/* Cards.  ⇄  openapi.yaml #/paths/~1cards */

const CardsResponse = listOf("cards", CardSchema);
const CardResponse = oneOf("card", CardSchema);

const toCard = (wire: { id: string; last4: string; status: string }): Card => ({
  id: wire.id,
  accountId: "",
  label: wire.status === "frozen" ? "Frozen card" : "Debit card",
  last4: wire.last4,
  status: wire.status === "frozen" ? "frozen" : "active",
  // No expiry on the wire; the UI only ever prints it.
  expiry: "—",
});

export const cardsApi = {
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
