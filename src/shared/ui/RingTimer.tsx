import { motion } from "motion/react";
import { cn } from "@/shared/lib";
import { tween } from "@/shared/config/motion";

/** Кольцо обратного отсчёта: progress 1 → 0. Цвет — токен через currentColor. */
export const RingTimer = ({ progress, size = 280, stroke = 10, className, children }: { progress: number; size?: number; stroke?: number; className?: string; children?: React.ReactNode }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" stroke="url(#ring-grad)"
          strokeDasharray={c} animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(1, progress))) }} transition={tween.fast} />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-sber-sky)" />
            <stop offset="50%" stopColor="var(--color-sber-green)" />
            <stop offset="100%" stopColor="var(--color-sber-spring)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};
