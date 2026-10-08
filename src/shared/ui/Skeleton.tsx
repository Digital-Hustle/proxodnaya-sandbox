import { motion } from "motion/react";
import { cn } from "@/shared/lib";
import { duration } from "@/shared/config/motion";

const pulse = { repeat: Infinity, repeatType: "reverse", duration: duration.slow * 2 } as const;

export const Skeleton = ({ className }: { className?: string }) => (
  <motion.div initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={pulse} className={cn("rounded-md bg-muted", className)} />
);
