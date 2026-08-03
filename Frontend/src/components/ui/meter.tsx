import { cn } from "@/lib/utils/cn";

type MeterProps = {
  /** 0–100. */
  value: number;
  label: string;
  /** Rendered inside the track as a second, lighter fill (e.g. projected). */
  secondaryValue?: number;
  className?: string;
  tone?: "accent" | "positive";
};

/**
 * A single ratio against a limit — the correct form for goal progress
 * (a two-slice pie would be the wrong one).
 *
 * Uses the native ARIA meter role so screen readers announce the ratio, and
 * carries a text label alongside so progress is never conveyed by fill alone.
 */
export function Meter({
  value,
  label,
  secondaryValue,
  className,
  tone = "accent",
}: MeterProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const fill = tone === "accent" ? "bg-accent" : "bg-positive";

  return (
    <div
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-pill bg-chart-track",
        className,
      )}
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      {secondaryValue !== undefined && (
        <div
          className="absolute inset-y-0 left-0 rounded-pill bg-accent/25"
          style={{ width: `${Math.min(100, Math.max(0, secondaryValue))}%` }}
        />
      )}
      <div
        className={cn(
          "absolute inset-y-0 left-0 rounded-pill transition-[width] duration-500 ease-[var(--ease-out)]",
          fill,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
