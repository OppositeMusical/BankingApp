import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-hover shadow-card",
  secondary:
    "bg-surface text-ink border border-border-strong hover:bg-surface-sunk",
  ghost: "text-ink-muted hover:bg-accent-soft hover:text-accent",
  danger: "bg-alert-soft text-alert border border-alert/30 hover:bg-alert/15",
};

const sizes: Record<Size, string> = {
  // Every size clears the 44px touch target minimum on its primary axis.
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-field font-medium",
        "transition-colors duration-150 ease-[var(--ease-out)]",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
