import { useMemo } from "react";
import { useOutletContext } from "react-router";
import { motion } from "motion/react";
import { useDb, presenceNow, shiftFor, workedMs, buildIntervals, siteOfZone } from "@/shared/api";
import { PageHeader } from "@/shared/ui";
import { durationRu, hhmm, todayKey, cn } from "@/shared/lib";
import { useNow, useOnline } from "@/shared/hooks";
import { PassQr } from "@/features/show-pass-qr";
import type { WorkerCtx } from "@/widgets/worker-shell";
import { fadeUp, stagger } from "@/shared/config/motion";
import { useWorkerCard } from "../lib/card";

const todayRu = () => new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
const greet = (h = new Date().getHours()) => (h < 5 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер");

export const WorkerPassPage = () => {
  const { key } = useOutletContext<WorkerCtx>();
  const db = useDb();
  const now = useNow(30000);
  const online = useOnline();
  const w = useWorkerCard(db.workers.find((x) => x.id === key.workerId), key.workerId);
  const pres = useMemo(() => presenceNow(db).find((p) => p.workerId === key.workerId), [db, key.workerId]);
  const sh = shiftFor(db, key.workerId);
  const worked = useMemo(() => workedMs(db, key.workerId, todayKey(), buildIntervals(db), now), [db, key.workerId, now]);
  if (!w) return <div className="py-10 text-center text-muted-foreground">Сотрудник не найден на этом устройстве</div>;

  const firstName = w.fullName.split(" ")[1] ?? w.fullName;
  const here = pres ? siteOfZone(db, pres.zoneId) : undefined;
  const zoneName = pres ? db.zones.find((z) => z.id === pres.zoneId)?.name : undefined;
  const stats = [
    { label: "Смена", value: sh ? `${sh.start}–${sh.end}` : "Нет смены" },
    { label: "Вход", value: pres ? hhmm(pres.since) : "—" },
    { label: "Сегодня", value: durationRu(worked) },
  ];

  return (
    <div>
      <PageHeader kicker={<span className="first-letter:uppercase">{todayRu()}</span>} title={`${greet()}, ${firstName}`}
        sub={!online ? "Нет сети, но пропуск работает: код подписывается на телефоне" : pres ? `${[here?.name, zoneName].filter(Boolean).join(", ") || "На объекте"} — с ${hhmm(pres.since)}. На выходе покажите код ещё раз` : "Покажите код камере терминала на проходной"} />

      <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="flex flex-col gap-3 sm:gap-4">
        {/* Пропуск: только код и сегодняшние цифры — владелец уже назван в приветствии. */}
        <motion.article variants={fadeUp} className="overflow-hidden rounded-xl bg-card shadow-float">
          <div className="flex flex-col items-center px-5 pb-5 pt-5 sm:px-6 sm:pt-6"><PassQr /></div>
          <dl className="flex border-t border-dashed border-border-strong">
            {stats.map(({ label, value }, i) => (
              <div key={label} className={cn("flex min-w-0 flex-auto flex-col gap-0.5 px-3 py-3.5 sm:px-5", i && "border-l border-border")}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="truncate text-sm font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </motion.article>

        <motion.p variants={fadeUp} className="px-2 text-center text-xs text-muted-foreground">
          Один код на все ваши объекты. Он одноразовый и меняется каждые 30 секунд, поэтому скриншот не подойдёт.
        </motion.p>
      </motion.div>
    </div>
  );
};
