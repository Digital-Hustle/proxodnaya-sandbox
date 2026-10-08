import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import type { DecisionResult } from "@/shared/api";
import { decisionView } from "@/entities/pass";
import { Avatar } from "@/shared/ui";
import { cn, hhmm, sound } from "@/shared/lib";
import { spring, tween } from "@/shared/config/motion";
import { motion as m } from "@/shared/config/tokens";

/** Экран вердикта: виден с 3 метров, текст — как пришёл с сервера, автосброс. */
export const DecisionScreen = ({ result, onDone }: { result: DecisionResult; onDone: () => void }) => {
  const v = decisionView[result.decision];
  const Icon = v.icon;
  const hold = result.decision === "ALLOW" ? m.kiosk.resultHoldMs : m.kiosk.resultHoldMs * 1.5;
  useEffect(() => {
    (result.decision === "ALLOW" || result.decision === "MANUAL" ? sound.allow : sound.deny)();
    const id = setTimeout(onDone, hold);
    return () => clearTimeout(id);
  }, [result, onDone, hold]);

  // Портал в body: экран вердикта всегда в светлой палитре (белый текст на зелёном/красном), даже в тёмном киоске.
  return createPortal(
    <motion.button type="button" onClick={onDone} aria-live="assertive"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={tween.base}
      className={cn("fixed inset-0 z-kiosk flex flex-col items-center justify-center gap-8 overflow-hidden p-8 text-center", v.bg, v.fg)}>
      <motion.div initial={{ scale: 1.6, opacity: 0.5 }} animate={{ scale: 1, opacity: 0 }} transition={tween.slow} className="absolute inset-0 rounded-full bg-white/20" />
      <motion.div initial={{ scale: 0.4, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={spring.bouncy}>
        <Icon className="size-36 sm:size-48" strokeWidth={1.75} />
      </motion.div>
      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring.soft, delay: m.stagger.step * 2 }} className="flex flex-col items-center gap-4">
        <div className="font-display text-5xl font-bold sm:text-6xl">{result.message}</div>
        <div className="max-w-3xl text-xl opacity-90 sm:text-2xl">{result.hint}</div>
      </motion.div>
      {result.worker && (
        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring.soft, delay: m.stagger.step * 4 }}
          className="flex items-center gap-4 rounded-xl bg-black/15 px-6 py-4 text-left">
          <Avatar name={result.worker.fullName} photo={result.worker.photo} className="size-16 text-xl" />
          <div>
            <div className="text-xl font-semibold">{result.worker.fullName}</div>
            <div className="text-base opacity-80">{result.worker.position} · {result.direction === "IN" ? "вход" : "выход"} в {hhmm(result.ts)}{result.score ? ` · сходство ${Math.round(result.score * 100)}%` : ""}</div>
          </div>
        </motion.div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-2 bg-black/10">
        <motion.div className="h-full origin-left bg-white/70" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: hold / 1000, ease: "linear" }} />
      </div>
      <div className="absolute bottom-6 text-sm opacity-70">{result.code} · нажмите, чтобы продолжить</div>
    </motion.button>,
    document.body,
  );
};
