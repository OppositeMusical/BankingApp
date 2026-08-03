"use client";

import { useState } from "react";
import { CreditCard, Snowflake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card as Surface } from "@/components/ui/card";
import type { Card } from "@/lib/types/banking";

/**
 * Freezing is instant and reversible, and deliberately takes one tap from the
 * security page — the moment you need it is the moment you don't want a flow.
 */
export function CardControls({ cards }: { cards: Card[] }) {
  const [frozen, setFrozen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(cards.map((card) => [card.id, card.status === "frozen"])),
  );
  const [announcement, setAnnouncement] = useState("");

  const toggle = (card: Card) => {
    setFrozen((current) => {
      const next = !current[card.id];
      setAnnouncement(
        next
          ? `${card.label} is frozen. No new payments will go through.`
          : `${card.label} is active again.`,
      );
      return { ...current, [card.id]: next };
    });
  };

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
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
                      ···· {card.last4} · expires {card.expiry}
                    </p>
                  </div>
                </div>
                <Badge tone={isFrozen ? "accent" : "positive"}>
                  {isFrozen ? "Frozen" : "Active"}
                </Badge>
              </div>

              <Button
                variant={isFrozen ? "primary" : "secondary"}
                size="sm"
                className="mt-4 w-full"
                onClick={() => toggle(card)}
              >
                <Snowflake className="size-4" aria-hidden />
                {isFrozen ? "Unfreeze card" : "Freeze card"}
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
