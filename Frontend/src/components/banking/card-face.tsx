import { Snowflake } from "lucide-react";
import type { Card } from "@/lib/types/banking";
import { cn } from "@/lib/utils/cn";

/**
 * A card, drawn as a card.
 *
 * Worth the pixels: a payment card is the one object in this app a person
 * already recognises by sight, and a row of text in a list throws that away.
 *
 * Cards are told apart by the ACCOUNT THEY DRAW ON, which is the only thing
 * that actually differs between two of them here — same issuer, same design,
 * no nickname field on the wire. So the account name is the headline and gets
 * a monogram, rather than the card type, which is "Debit" on all of them.
 *
 * Deliberately not colour-coded per account. Only three theme tokens clear
 * 4.5:1 in both light and dark (accent, positive, negative), and the latter
 * two already mean money-in and money-out — a green card would read as a
 * status, not an identity. Colour alone is also the one distinction a
 * colour-blind user cannot use, and this palette is validated for CVD
 * separation elsewhere precisely because that matters.
 *
 * Only four dots precede the last four. The system stores no full number, so
 * `···· ···· ···· 1234` would imply one is being withheld.
 */
export function CardFace({
  card,
  frozen,
  spendsFrom,
}: {
  card: Card;
  frozen: boolean;
  /** Name of the account this card draws on. */
  spendsFrom?: string;
}) {
  const drawsOn = spendsFrom ?? "Main account";

  return (
    <div
      className={cn(
        "relative flex aspect-[1.586/1] max-w-xs flex-col justify-between overflow-hidden rounded-card p-4 text-accent-on transition-all duration-200",
        frozen ? "bg-ink-subtle saturate-50" : "bg-accent shadow-raised",
      )}
    >
      {/* A single soft highlight, so the face is not a flat rectangle. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-12 size-40 rounded-pill bg-white/10"
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-pill bg-white/20 text-sm font-semibold"
          >
            {drawsOn.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium leading-tight">
              {drawsOn}
            </span>
            <span className="block text-[11px] leading-tight opacity-80">
              {card.kind === "secured_credit" ? "Secured credit" : "Debit"}
              {card.virtual === false ? " · physical" : " · virtual"}
            </span>
          </span>
        </div>

        {frozen && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-black/25 px-2 py-0.5 text-[11px] font-medium">
            <Snowflake className="size-3" aria-hidden />
            Frozen
          </span>
        )}
      </div>

      <p className="relative font-numbers text-lg font-semibold tabular tracking-wide">
        ···· {card.last4}
      </p>
    </div>
  );
}
