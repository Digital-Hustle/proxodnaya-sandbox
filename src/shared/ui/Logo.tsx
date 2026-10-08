import { cn } from "@/shared/lib";

/** Заглушка логотипа до официального (ADR-036): знак-галочка в фирменном градиенте + слово. */
export const Logo = ({ className, compact }: { className?: string; compact?: boolean }) => (
  <span className={cn("inline-flex items-center gap-2 font-display font-semibold", className)}>
    <span className="flex size-8 items-center justify-center rounded-sm bg-brand-gradient-conic shadow-sm">
      <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </span>
    {!compact && <span className="text-lg">Проходная</span>}
  </span>
);
