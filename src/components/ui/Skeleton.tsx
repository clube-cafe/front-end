import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-warm-gray via-border to-warm-gray bg-[length:200%_100%]",
        className
      )}
    />
  );
}
