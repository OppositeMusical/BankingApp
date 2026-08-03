"use client";

import { formatMoney, splitMoneyParts } from "@/lib/format/money";
import type { Money } from "@/lib/types/banking";
import { useUIPreferences } from "@/lib/store/ui-preferences";
import { cn } from "@/lib/utils/cn";

type AmountProps = {
  value: Money;
  /** Colour by direction. Off by default — most balances are just balances. */
  tone?: "auto" | "plain";
  signed?: boolean;
  compactWhole?: boolean;
  className?: string;
  /** De-emphasise the cents. For hero balances. */
  splitFraction?: boolean;
};

/**
 * The single component responsible for rendering money.
 *
 * It owns Privacy Mode, so no screen has to remember to handle it: if the
 * preference is on, every amount in the app blurs at once. The real value stays
 * in the DOM for assistive tech but is marked so it isn't read out casually —
 * blurring is a shoulder-surfing defence, not an access-control boundary.
 */
export function Amount({
  value,
  tone = "plain",
  signed = false,
  compactWhole = false,
  className,
  splitFraction = false,
}: AmountProps) {
  const { privacyMode } = useUIPreferences();

  const toneClass =
    tone === "auto"
      ? value.amount < 0
        ? "text-negative"
        : "text-positive"
      : undefined;

  const formatted = formatMoney(value, { signed, compactWhole });

  return (
    <span
      className={cn("tabular", toneClass, privacyMode && "privacy-blur", className)}
      // When blurred the figure is decorative; the surrounding label still
      // describes what it is, and unblurring is one keypress away.
      aria-hidden={privacyMode || undefined}
    >
      {splitFraction ? <SplitAmount value={value} /> : formatted}
    </span>
  );
}

function SplitAmount({ value }: { value: Money }) {
  const { whole, fraction } = splitMoneyParts(value);
  return (
    <>
      {whole}
      <span className="text-[0.55em] align-baseline text-ink-muted">
        {fraction}
      </span>
    </>
  );
}
