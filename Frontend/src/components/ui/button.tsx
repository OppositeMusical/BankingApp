import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#00f0ff] text-black border-4 border-black shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#5cffff] active:translate-y-[6px] active:translate-x-[4px] active:shadow-none uppercase tracking-widest font-display",
  secondary:
    "bg-[#ffe600] text-black border-4 border-black shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#fff04d] active:translate-y-[6px] active:translate-x-[4px] active:shadow-none uppercase tracking-widest font-display",
  ghost:
    "text-ink-muted border-4 border-transparent hover:border-black hover:bg-surface-sunk hover:text-ink hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[6px] active:translate-x-[4px] active:shadow-none uppercase tracking-widest font-display",
  danger:
    "bg-[#ff003c] text-white border-4 border-black shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ff4d79] active:translate-y-[6px] active:translate-x-[4px] active:shadow-none uppercase tracking-widest font-display",
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

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-sm font-medium",
    "transition-colors duration-150 ease-[var(--ease-out)]",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
