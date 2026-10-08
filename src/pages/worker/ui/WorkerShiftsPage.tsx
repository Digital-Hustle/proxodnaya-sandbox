import { useOutletContext } from "react-router";
import { CalendarDays } from "lucide-react";
import { useDb } from "@/shared/api";
import { Badge, Card, EmptyState } from "@/shared/ui";
import { atTime, todayKey, weekdayRu, cn } from "@/shared/lib";
import type { WorkerCtx } from "@/widgets/worker-shell";

export const WorkerShiftsPage = () => {
  const { key } = useOutletContext<WorkerCtx>();
  const db = useDb();
  const today = todayKey();
  const list = db.shifts.filter((s) => s.workerId === key.workerId && s.day >= today).sort((a, b) => a.day.localeCompare(b.day)).slice(0, 10);
  return (
    <div className="flex flex-col gap-4 pt-2">
      <h1 className="font-display text-2xl font-semibold">Мои смены</h1>
      {list.length === 0 && <EmptyState icon={<CalendarDays />} title="Смен пока нет" text="Прораб ещё не поставил график" />}
      <div className="flex flex-col gap-2">
        {list.map((s) => (
          <Card key={s.id} className={cn("flex items-center justify-between p-4", s.day === today && "border-ring")}>
            <div>
              <div className="font-semibold capitalize">{weekdayRu(atTime(s.day, "12:00"))}</div>
              <div className="text-sm text-muted-foreground">{s.start} – {s.end}</div>
            </div>
            {s.day === today && <Badge tone="success">Сегодня</Badge>}
          </Card>
        ))}
      </div>
    </div>
  );
};
