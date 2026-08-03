import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "accent" | "positive" | "negative" | "alert";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-sunk text-ink-muted border-border",
  accent: "bg-accent-soft text-accent border-accent/20",
  positive: "bg-positive-soft text-positive border-positive/25",
  negative: "bg-negative-soft text-negative border-negative/25",
  alert: "bg-alert-soft text-alert border-alert/25",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1",
        "text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
