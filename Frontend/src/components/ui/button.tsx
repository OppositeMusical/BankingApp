import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-on border-2 border-border-strong shadow-card hover:bg-accent-hover active:translate-y-[2px] active:translate-x-[2px] active:shadow-none",
  secondary:
    "bg-surface text-ink border-2 border-border-strong shadow-card hover:bg-surface-sunk active:translate-y-[2px] active:translate-x-[2px] active:shadow-none",
  ghost:
    "text-ink-muted border-2 border-transparent hover:border-border-strong hover:bg-accent-soft hover:text-accent hover:shadow-card active:translate-y-[2px] active:translate-x-[2px] active:shadow-none",
  danger:
    "bg-alert-soft text-alert border-2 border-alert/30 shadow-card hover:bg-alert/15 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none",
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
