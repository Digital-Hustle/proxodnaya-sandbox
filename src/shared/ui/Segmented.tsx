import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/shared/lib";
import { spring } from "@/shared/config/motion";

type Opt<T extends string> = { value: T; label: React.ReactNode };

export function Segmented<T extends string>({ value, onChange, options, className, size = "md" }: { value: T; onChange: (v: T) => void; options: Opt<T>[]; className?: string; size?: "md" | "lg" }) {
  const id = useId();
  return (
    <div className={cn("inline-flex rounded-md bg-secondary p-1", className)} role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} onClick={() => onChange(o.value)}
          className={cn("relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-4 font-semibold transition-colors duration-fast [&_svg]:size-5",
            size === "lg" ? "h-control-md text-lg" : "h-control-xs text-sm", o.value === value ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
          {o.value === value && <motion.span layoutId={`seg-${id}`} transition={spring.snappy} className="absolute inset-0 rounded-sm bg-card shadow-sm" />}
          <span className="relative z-base flex items-center gap-2">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
