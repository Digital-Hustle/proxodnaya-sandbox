import { useOutletContext } from "react-router";
import { History } from "lucide-react";
import { useDb } from "@/shared/api";
import { AttemptRow } from "@/entities/pass";
import { Card, EmptyState } from "@/shared/ui";
import { dateRu, dayKey } from "@/shared/lib";
import type { WorkerCtx } from "@/widgets/worker-shell";

export const WorkerHistoryPage = () => {
  const { key } = useOutletContext<WorkerCtx>();
  const db = useDb();
  const mine = db.attempts.filter((a) => a.workerId === key.workerId).slice(-60).reverse();
  const groups = mine.reduce<Record<string, typeof mine>>((acc, a) => { (acc[dayKey(a.ts)] ??= []).push(a); return acc; }, {});
  return (
    <div className="flex flex-col gap-4 pt-2">
      <h1 className="font-display text-2xl font-semibold">История проходов</h1>
      {mine.length === 0 && <EmptyState icon={<History />} title="Проходов ещё не было" text="В песочнице история видна, если киоск открыт на этом же устройстве или вкладке." />}
      {Object.entries(groups).map(([day, list]) => (
        <div key={day}>
          <div className="mb-2 text-sm font-semibold text-muted-foreground">{dateRu(list[0].ts)}</div>
          <Card className="divide-y divide-border/60 px-4">{list.map((a) => <AttemptRow key={a.id} a={a} />)}</Card>
        </div>
      ))}
    </div>
  );
};
