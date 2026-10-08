import { motion } from "motion/react";
import { cn } from "@/shared/lib";
import { spring } from "@/shared/config/motion";

/** Полоса заполнения на пружине. tone: brand — фирменный градиент. */
export const Progress = ({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "primary" | "warning" | "danger" }) => (
  <div className={cn("h-1.5 min-w-0 overflow-hidden rounded-full bg-surface", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
    <motion.div className={cn("h-full origin-left rounded-full", { brand: "bg-brand-gradient", primary: "bg-primary", warning: "bg-warning", danger: "bg-danger" }[tone])}
      initial={{ scaleX: 0 }} animate={{ scaleX: Math.max(0, Math.min(1, value)) }} transition={spring.bar} />
  </div>
);
