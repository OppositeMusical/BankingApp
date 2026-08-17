import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent/90 backdrop-blur-md text-accent-on shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_4px_12px_rgba(0,0,0,0.5)] border border-white/20 hover:bg-accent active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:brightness-95",
  secondary:
    "bg-white/5 backdrop-blur-md text-ink shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.3)] border border-white/10 hover:bg-white/10 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] active:brightness-95",
  ghost:
    "text-ink-muted hover:bg-white/5 hover:text-ink hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_5px_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:bg-black/20",
  danger:
    "bg-alert/90 backdrop-blur-md text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.5)] border border-white/20 hover:bg-alert active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] active:brightness-95",
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
    "inline-flex items-center justify-center rounded-field font-medium",
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
