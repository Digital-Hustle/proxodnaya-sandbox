import { cn } from "@/shared/lib";

/** Знак: плитка в фирменном градиенте Сбера с галочкой-проходом + слово. */
export const LogoMark = ({ className }: { className?: string }) => (
  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-sm bg-brand-gradient", className)}>
    <svg viewBox="0 0 24 24" className="size-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12h4l2.5 4.5L15 6.5" /><path d="M17 12h3" />
    </svg>
  </span>
);

export const Logo = ({ className, compact, sub }: { className?: string; compact?: boolean; sub?: string }) => (
  <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
    <LogoMark />
    {!compact && (
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate font-display text-lg font-medium tracking-display">Проходная</span>
        {sub && <span className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
    )}
  </span>
);
