import { motion } from "motion/react";
import { cn } from "@/shared/lib";
import { spring } from "@/shared/config/motion";

export const Switch = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) => (
  <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
    className={cn("flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-fast", checked ? "justify-end bg-primary" : "justify-start bg-border")}>
    <motion.span layout transition={spring.press} className="size-6 rounded-full bg-card shadow-sm" />
  </button>
);
