import { Amount } from "@/components/banking/amount";
import type { Money } from "@/lib/types/banking";
import { cn } from "@/lib/utils/cn";

/**
 * A single headline number. Deliberately not a one-bar chart — a stat tile is
 * the right form for a lone current value.
 */
export function StatTile({
  label,
  value,
  caption,
  tone = "plain",
  className,
}: {
  label: string;
  value: Money;
  caption?: string;
  tone?: "auto" | "plain";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/5 bg-white/[0.02] px-4 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-2xl",
        className,
      )}
    >
      <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
        {label}
      </p>
      <p className="mt-1.5 font-numbers text-2xl font-semibold text-ink">
        <Amount value={value} tone={tone} compactWhole />
      </p>
      {caption && <p className="mt-1 text-xs text-ink-muted">{caption}</p>}
    </div>
  );
}
