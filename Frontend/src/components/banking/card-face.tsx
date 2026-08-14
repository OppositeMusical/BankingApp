import { Snowflake } from "lucide-react";
import type { Card } from "@/lib/types/banking";
import { cn } from "@/lib/utils/cn";

/**
 * A card, drawn as a card.
 *
 * Worth the pixels: a payment card is the one object in this app a person
 * already recognises by sight, and a row of text in a list throws that away.
 * Frozen is a visual state rather than only a word — desaturated, with the
 * snowflake sitting on the face — so a glance answers "can I use this?".
 *
 * Only the last four are shown, and only four dots precede them. The system
 * stores no full number, so `···· ···· ···· 1234` would imply one is being
 * withheld.
 */
export function CardFace({
  card,
  frozen,
  spendsFrom,
}: {
  card: Card;
  frozen: boolean;
  /** Name of the sub-account this card draws on, when it has one. */
  spendsFrom?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-[1.586/1] max-w-xs flex-col justify-between overflow-hidden rounded-card p-4 text-accent-on transition-all duration-200",
        frozen
          ? "bg-ink-subtle saturate-50"
          : "bg-accent shadow-raised",
      )}
    >
      {/* A single soft highlight, so the face is not a flat rectangle. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-12 size-40 rounded-pill bg-white/10"
      />

      <div className="relative flex items-start justify-between gap-2">
        <span className="text-xs font-medium tracking-wide uppercase opacity-90">
          {card.kind === "secured_credit" ? "Secured credit" : "Debit"}
        </span>
        {frozen && (
          <span className="inline-flex items-center gap-1 rounded-pill bg-black/25 px-2 py-0.5 text-[11px] font-medium">
            <Snowflake className="size-3" aria-hidden />
            Frozen
          </span>
        )}
      </div>

      <div className="relative">
        <p className="font-display text-lg font-semibold tabular tracking-wide">
          ···· {card.last4}
        </p>
        <p className="mt-0.5 truncate text-xs opacity-90">
          {spendsFrom ? `Spends from ${spendsFrom}` : "Virtual card"}
        </p>
      </div>
    </div>
  );
}
