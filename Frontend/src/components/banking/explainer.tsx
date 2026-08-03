import { Info } from "lucide-react";

/**
 * A plain-language explanation attached to the thing it explains, opened on
 * demand. Built on <details> so it works without JavaScript, is keyboard
 * operable for free, and is announced correctly by screen readers.
 *
 * Financial education lives next to the number it clarifies rather than in a
 * separate "learn" section nobody visits.
 */
export function Explainer({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group mt-3">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-field text-xs font-medium text-accent hover:underline [&::-webkit-details-marker]:hidden">
        <Info className="size-3.5" aria-hidden />
        {label}
      </summary>
      <div className="mt-2 rounded-field border border-border bg-surface-sunk px-3.5 py-3 text-sm leading-relaxed text-ink-muted">
        {children}
      </div>
    </details>
  );
}
