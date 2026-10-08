import { useMemo } from "react";
import { useOutletContext } from "react-router";
import { motion } from "motion/react";
import { MapPin, Clock, Timer } from "lucide-react";
import { useDb, presenceNow, shiftFor, workedMs, buildIntervals } from "@/shared/api";
import { Avatar, Badge, Card } from "@/shared/ui";
import { durationRu, hhmm, todayKey } from "@/shared/lib";
import { useNow } from "@/shared/hooks";
import { PassQr } from "@/features/show-pass-qr";
import type { WorkerCtx } from "@/widgets/worker-shell";
import { fadeUp, stagger } from "@/shared/config/motion";

export const WorkerPassPage = () => {
  const { key } = useOutletContext<WorkerCtx>();
  const db = useDb();
  const now = useNow(30000);
  const w = db.workers.find((x) => x.id === key.workerId);
  const pres = useMemo(() => presenceNow(db).find((p) => p.workerId === key.workerId), [db, key.workerId]);
  const sh = shiftFor(db, key.workerId);
  const worked = useMemo(() => workedMs(db, key.workerId, todayKey(), buildIntervals(db), now), [db, key.workerId, now]);
  if (!w) return <div className="py-10 text-center text-muted-foreground">Сотрудник не найден на этом устройстве</div>;
  return (
    <motion.div variants={stagger()} initial="hidden" animate="show" className="flex flex-col gap-4">
      <motion.div variants={fadeUp} className="flex items-center gap-3 pt-2">
        <Avatar name={w.fullName} photo={w.photo} className="size-12" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-semibold">{w.fullName}</div>
          <div className="text-sm text-muted-foreground">{w.position} · {w.contractor}</div>
        </div>
        {pres ? <Badge tone="success">На объекте</Badge> : <Badge>Не на объекте</Badge>}
      </motion.div>
      <motion.div variants={fadeUp}>
        <Card className="flex flex-col items-center gap-2 rounded-2xl px-4 py-6">
          <PassQr size={292} />
          <div className="text-center text-sm text-muted-foreground">Покажите код камере киоска. Скриншот не сработает — код живёт 30 секунд и одноразовый.</div>
        </Card>
      </motion.div>
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
        {[
          { icon: MapPin, label: "Зона", value: pres ? db.zones.find((z) => z.id === pres.zoneId)?.name : "—" },
          { icon: Clock, label: "Смена", value: sh ? `${sh.start}–${sh.end}` : "нет" },
          { icon: Timer, label: "Сегодня", value: durationRu(worked) },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="flex flex-col gap-1 p-3">
            <Icon className="size-4 text-brand" />
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-sm font-semibold">{value}</div>
          </Card>
        ))}
      </motion.div>
      {pres && <motion.div variants={fadeUp} className="text-center text-xs text-muted-foreground">Вход в {hhmm(pres.since)}. Не забудьте отметить выход.</motion.div>}
    </motion.div>
  );
};
