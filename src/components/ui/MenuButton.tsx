import { cn } from "@/lib/cn";

interface MenuButtonProps {
  open: boolean;
  onClick: () => void;
  className?: string;
}

export function MenuButton({ open, onClick, className }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Fechar menu" : "Abrir menu"}
      aria-expanded={open}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft hover:bg-warm-gray hover:text-primary transition-colors md:hidden",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        {open ? (
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        ) : (
          <>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </>
        )}
      </svg>
    </button>
  );
}
