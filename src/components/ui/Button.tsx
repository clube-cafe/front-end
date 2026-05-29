import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-secondary to-accent text-white shadow-sm hover:shadow-md hover:from-secondary-dark hover:to-accent-dark active:translate-y-px",
  secondary:
    "bg-white text-primary border border-border hover:bg-warm-gray hover:border-secondary",
  ghost: "bg-transparent text-ink-soft hover:bg-warm-gray hover:text-primary",
  danger: "bg-maroon text-white hover:bg-maroon-dark shadow-sm",
  success: "bg-success text-white hover:bg-success-soft shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, fullWidth, className, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...rest}
      >
        {loading && (
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
