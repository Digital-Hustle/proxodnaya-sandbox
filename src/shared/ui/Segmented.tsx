import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/shared/lib";
import { spring } from "@/shared/config/motion";

type Opt<T extends string> = { value: T; label: React.ReactNode; icon?: React.ReactNode; title?: string };

/** Сегменты как в шапке sberbank.ru: дорожка + белая «пилюля», которая перепрыгивает пружиной. Не переносится — скроллится. */
export function Segmented<T extends string>({ value, onChange, options, className, size = "md", block, label }: {
  value: T; onChange: (v: T) => void; options: Opt<T>[]; className?: string; size?: "sm" | "md" | "lg"; block?: boolean; label?: string;
}) {
  const id = useId();
  return (
    <div className={cn("scrollbar-none max-w-full overflow-x-auto rounded-md bg-surface p-1", block ? "flex w-full" : "inline-flex", className)} role="tablist" aria-label={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={on} title={o.title} onClick={() => onChange(o.value)}
            className={cn("relative flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium outline-none transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-ring",
              block && "flex-1",
              size === "lg" ? "h-control-md px-5 text-base [&_svg]:size-5" : size === "sm" ? "h-7 px-2.5 text-xs [&_svg]:size-4" : "h-control-xs px-3.5 text-sm [&_svg]:size-4",
              on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {on && <motion.span layoutId={`seg-${id}`} transition={spring.snappy} className="absolute inset-0 rounded-sm bg-card shadow-xs" />}
            <span className="relative z-raised flex items-center gap-2">{o.icon}{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
