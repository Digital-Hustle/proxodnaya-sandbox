import { useOutletContext } from "react-router";
import { motion } from "motion/react";
import { History } from "lucide-react";
import { useDb } from "@/shared/api";
import { AttemptRow } from "@/entities/pass";
import { Card, EmptyState } from "@/shared/ui";
import { dateRu, dayKey } from "@/shared/lib";
import { fadeUp, stagger } from "@/shared/config/motion";
import type { WorkerCtx } from "@/widgets/worker-shell";

export const WorkerHistoryPage = () => {
  const { key } = useOutletContext<WorkerCtx>();
  const db = useDb();
  const mine = db.attempts.filter((a) => a.workerId === key.workerId).slice(-60).reverse();
  const groups = mine.reduce<Record<string, typeof mine>>((acc, a) => { (acc[dayKey(a.ts)] ??= []).push(a); return acc; }, {});
  return (
    <motion.div variants={stagger()} initial="hidden" animate="show" className="flex flex-col gap-5 pt-2">
      <motion.h1 variants={fadeUp} className="px-1 font-display text-2xl font-medium tracking-display">История проходов</motion.h1>
      {mine.length === 0 && <Card><EmptyState icon={<History />} title="Проходов ещё не было" text="В песочнице история видна, если киоск открыт на этом же устройстве." /></Card>}
      {Object.entries(groups).map(([day, list]) => (
        <motion.section key={day} variants={fadeUp}>
          <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">{dateRu(list[0].ts)}</h2>
          <Card className="divide-y divide-border px-4">{list.map((a) => <AttemptRow key={a.id} a={a} />)}</Card>
        </motion.section>
      ))}
    </motion.div>
  );
};
