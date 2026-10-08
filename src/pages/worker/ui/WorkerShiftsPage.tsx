import { useOutletContext } from "react-router";
import { motion } from "motion/react";
import { CalendarDays } from "lucide-react";
import { useDb } from "@/shared/api";
import { Status, Card, EmptyState } from "@/shared/ui";
import { atTime, todayKey, cn } from "@/shared/lib";
import { fadeUp, stagger } from "@/shared/config/motion";
import type { WorkerCtx } from "@/widgets/worker-shell";

const dow = (day: string) => new Date(atTime(day, "12:00")).toLocaleDateString("ru-RU", { weekday: "short" });
const dnum = (day: string) => new Date(atTime(day, "12:00")).getDate();
const mon = (day: string) => new Date(atTime(day, "12:00")).toLocaleDateString("ru-RU", { month: "long", day: "numeric" }).split(" ")[1];

export const WorkerShiftsPage = () => {
  const { key } = useOutletContext<WorkerCtx>();
  const db = useDb();
  const today = todayKey();
  const list = db.shifts.filter((s) => s.workerId === key.workerId && s.day >= today).sort((a, b) => a.day.localeCompare(b.day)).slice(0, 10);
  return (
    <motion.div variants={stagger()} initial="hidden" animate="show" className="flex flex-col gap-5 pt-2">
      <motion.h1 variants={fadeUp} className="px-1 font-display text-2xl font-medium tracking-display">Мои смены</motion.h1>
      {list.length === 0 && <Card><EmptyState icon={<CalendarDays />} title="Смен пока нет" text="Прораб ещё не поставил график" /></Card>}
      <div className="flex flex-col gap-2">
        {list.map((s) => (
          <motion.div key={s.id} variants={fadeUp}>
            <Card className={cn("flex items-center gap-4 p-3 pr-4", s.day === today && "ring-2 ring-ring")}>
              <div className={cn("flex size-14 shrink-0 flex-col items-center justify-center rounded-md", s.day === today ? "bg-accent text-accent-foreground" : "bg-surface")}>
                <span className="text-xs capitalize opacity-80">{dow(s.day)}</span>
                <span className="font-display text-xl font-medium leading-none tabular-nums">{dnum(s.day)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium tabular-nums">{s.start} – {s.end}</div>
                <div className="text-sm text-muted-foreground">{mon(s.day)}</div>
              </div>
              {s.day === today && <Status tone="success" dot>Сегодня</Status>}
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
