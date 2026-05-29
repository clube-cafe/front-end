import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "success" | "error" | "warning" | "info";

const tones: Record<Tone, { wrap: string; icon: string }> = {
  success: { wrap: "bg-success/10 border-success/30 text-success", icon: "✓" },
  error: { wrap: "bg-maroon/10 border-maroon/30 text-maroon", icon: "!" },
  warning: { wrap: "bg-accent/15 border-accent/40 text-accent-dark", icon: "⚠" },
  info: { wrap: "bg-secondary/10 border-secondary/30 text-secondary-dark", icon: "i" },
};

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium",
        t.wrap,
        className
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/15 text-xs font-bold"
      >
        {t.icon}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
