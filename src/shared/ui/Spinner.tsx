import { motion } from "motion/react";
import { cn } from "@/shared/lib";
import { duration } from "@/shared/config/motion";

const spin = { duration: duration.hero, ease: "linear", repeat: Infinity } as const;

export const Spinner = ({ className }: { className?: string }) => (
  <motion.span aria-label="Загрузка" animate={{ rotate: 360 }} transition={spin}
    className={cn("inline-block size-5 rounded-full border-2 border-current border-t-transparent", className)} />
);
