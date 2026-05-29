import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const tones: Record<Tone, string> = {
  neutral: "bg-warm-gray text-ink-soft",
  success: "bg-success/15 text-success",
  warning: "bg-accent/20 text-accent-dark",
  danger: "bg-maroon/15 text-maroon",
  info: "bg-secondary/15 text-secondary-dark",
  accent: "bg-secondary text-white",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
