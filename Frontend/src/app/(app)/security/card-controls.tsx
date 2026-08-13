"use client";

import { useState } from "react";
import { CreditCard, Snowflake } from "lucide-react";
import { Amount } from "@/components/banking/amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card as Surface } from "@/components/ui/card";
import { cardsApi, describeError } from "@/lib/api";
import { formatFullDate } from "@/lib/format/date";
import type { Card } from "@/lib/types/banking";

/**
 * Freezing is instant and reversible, and deliberately takes one tap — the
 * moment you need it is the moment you don't want a flow.
 *
 * The state is optimistic and then reconciled: the badge flips immediately
 * because that is what makes it feel instant, but the API call is what decides.
 * If it fails the toggle goes back and says so, because a card that shows
 * "Frozen" while the network never heard about it is worse than no button.
 */
export function CardControls({
  cards,
  accountNames = {},
}: {
  cards: Card[];
  /** sub-account id -> name, so a card can say which pot it spends from. */
  accountNames?: Record<string, string>;
}) {
  const [frozen, setFrozen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(cards.map((card) => [card.id, card.status === "frozen"])),
  );
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const toggle = async (card: Card) => {
    const next = !frozen[card.id];
    setFrozen((current) => ({ ...current, [card.id]: next }));
    setPending(card.id);
    setError(null);

    try {
      await cardsApi.setFrozen(card.id, next);
      setAnnouncement(
        next
          ? `${card.label} is frozen. No new payments will go through.`
          : `${card.label} is active again.`,
      );
    } catch (err) {
      setFrozen((current) => ({ ...current, [card.id]: !next }));
      setError(describeError(err));
      setAnnouncement("That didn't work. The card is unchanged.");
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {error && (
        <p role="alert" className="mb-3 text-sm text-alert">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const isFrozen = frozen[card.id];
          return (
            <Surface key={card.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-9 place-items-center rounded-pill bg-surface-sunk text-ink-muted"
                    aria-hidden
                  >
                    <CreditCard className="size-[18px]" />
                  </span>
                  <div>
                    <p className="font-medium text-ink">{card.label}</p>
                    <p className="text-xs text-ink-subtle">
                      ···· {card.last4}
                      {card.kind === "secured_credit" && " · secured credit"}
                    </p>
                  </div>
                </div>
                <Badge tone={isFrozen ? "accent" : "positive"}>
                  {isFrozen ? "Frozen" : "Active"}
                </Badge>
              </div>

              <dl className="mt-4 divide-y divide-border border-y border-border text-sm">
                {/* Last four only, and labelled as such. The system stores no
                    full card number — `···· ···· ···· 1234` would imply one is
                    being withheld, and a made-up 16 digits on a banking screen
                    reads as a real credential. */}
                <Detail term="Last four">···· {card.last4}</Detail>
                <Detail term="Type">
                  {card.kind === "secured_credit" ? "Secured credit" : "Debit"}
                  {card.virtual === false ? " · physical" : " · virtual"}
                </Detail>
                {card.subAccountId && accountNames[card.subAccountId] && (
                  <Detail term="Spends from">
                    {accountNames[card.subAccountId]}
                  </Detail>
                )}
                {card.limit && (
                  <Detail term="Per-transaction limit">
                    <Amount value={card.limit} />
                  </Detail>
                )}
                {card.issuedAt && (
                  <Detail term="Issued">{formatFullDate(card.issuedAt)}</Detail>
                )}
                <Detail term="Status">{isFrozen ? "Frozen" : "Active"}</Detail>
              </dl>

              <p className="mt-2 text-xs text-ink-subtle">
                Virtual cards here have no full number — the sandbox issues the
                last four only.
              </p>

              <Button
                variant={isFrozen ? "primary" : "secondary"}
                size="sm"
                className="mt-4 w-full"
                onClick={() => toggle(card)}
                disabled={pending === card.id}
              >
                <Snowflake className="size-4" aria-hidden />
                {pending === card.id
                  ? "Saving…"
                  : isFrozen
                    ? "Unfreeze card"
                    : "Freeze card"}
              </Button>

              {isFrozen && (
                <p className="mt-2.5 text-xs text-ink-muted">
                  Payments are blocked. Direct debits and refunds still go
                  through.
                </p>
              )}
            </Surface>
          );
        })}
      </div>
    </>
  );
}

function Detail({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-ink-muted">{term}</dt>
      <dd className="text-right font-medium tabular text-ink">{children}</dd>
    </div>
  );
}
