import { AnimatePresence, motion } from "motion/react";
import { useDb } from "@/shared/api";
import { AttemptRow } from "@/entities/pass";
import { EmptyState } from "@/shared/ui";
import { ScrollText } from "lucide-react";
import { spring } from "@/shared/config/motion";

/** Лента последних проходов; обновляется сама (другая вкладка с киоском → BroadcastChannel). */
export const LiveFeed = ({ limit = 8 }: { limit?: number }) => {
  const db = useDb();
  const list = db.attempts.slice(-limit).reverse();
  const who = (id?: string) => db.workers.find((w) => w.id === id)?.fullName ?? "Неизвестный пропуск";
  if (!list.length) return <EmptyState icon={<ScrollText />} title="Проходов пока нет" text="Откройте киоск и покажите QR" />;
  return (
    <div className="divide-y divide-border/60">
      <AnimatePresence initial={false}>
        {list.map((a) => (
          <motion.div key={a.id} layout initial={{ opacity: 0, x: -16, backgroundColor: "var(--accent)" }} animate={{ opacity: 1, x: 0, backgroundColor: "var(--card)" }} transition={spring.soft}>
            <AttemptRow a={a} who={<div className="truncate text-sm font-medium">{who(a.workerId)}</div>} className="px-5" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
