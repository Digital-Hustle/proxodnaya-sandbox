import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Eye, ArrowDown } from "lucide-react";
import type { Challenge } from "@/shared/api";
import { spring } from "@/shared/config/motion";
import { motion as m } from "@/shared/config/tokens";

const ICON = { "turn-left": ArrowLeft, "turn-right": ArrowRight, blink: Eye, nod: ArrowDown };
const SWAY = { "turn-left": { x: [0, -24, 0] }, "turn-right": { x: [0, 24, 0] }, blink: { scaleY: [1, 0.1, 1] }, nod: { y: [0, 18, 0] } };
const loop = { duration: m.duration.hero * 2, repeat: Infinity, ease: m.ease.inOut };

/** Подсказка челленджа живости поверх видео. */
export const ChallengePrompt = ({ challenge, name, progress }: { challenge: Challenge; name: string; progress: number }) => {
  const Icon = ICON[challenge.kind];
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={spring.soft}
      className="flex flex-col items-center gap-5 rounded-xl bg-card/85 px-8 py-6 text-center shadow-pop backdrop-blur-md">
      <div className="text-base text-muted-foreground">{name}, посмотрите в камеру</div>
      <motion.div animate={SWAY[challenge.kind]} transition={loop} className="flex size-20 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-10" />
      </motion.div>
      <div className="font-display text-3xl font-semibold">{challenge.text}</div>
      <div className="h-2 w-64 overflow-hidden rounded-full bg-muted">
        <motion.div className="h-full origin-left bg-brand-gradient" animate={{ scaleX: progress }} transition={{ duration: m.duration.fast }} />
      </div>
    </motion.div>
  );
};
