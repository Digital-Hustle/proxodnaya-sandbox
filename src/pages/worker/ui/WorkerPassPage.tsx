import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router";
import { motion } from "motion/react";
import { useDb, presenceNow, shiftFor, workedMs, buildIntervals } from "@/shared/api";
import { Avatar, Status, LogoMark } from "@/shared/ui";
import { durationRu, hhmm, todayKey } from "@/shared/lib";
import { useNow, useOnline } from "@/shared/hooks";
import { PassQr } from "@/features/show-pass-qr";
import type { WorkerCtx } from "@/widgets/worker-shell";
import { fadeUp, stagger } from "@/shared/config/motion";

// ADR-043: карточка пропуска хранится на телефоне — без сети приложение открывается из кэша и показывает её вместе с QR.
const CARD = "proxodnaya.worker.card";
type Card = { id: string; fullName: string; position: string; contractor: string; photo?: string };
const readCard = (id: string): Card | undefined => {
  try { const c = JSON.parse(localStorage.getItem(CARD) ?? "null") as Card | null; return c?.id === id ? c : undefined; } catch { return undefined; }
};

export const WorkerPassPage = () => {
  const { key } = useOutletContext<WorkerCtx>();
  const db = useDb();
  const now = useNow(30000);
  const online = useOnline();
  const live = db.workers.find((x) => x.id === key.workerId);
  useEffect(() => {
    if (!live) return;
    const { id, fullName, position, contractor, photo } = live;
    try { localStorage.setItem(CARD, JSON.stringify({ id, fullName, position, contractor, photo })); } catch { /* фото может не влезть — карточка без него */ }
  }, [live]);
  const w = live ?? readCard(key.workerId);
  const pres = useMemo(() => presenceNow(db).find((p) => p.workerId === key.workerId), [db, key.workerId]);
  const sh = shiftFor(db, key.workerId);
  const worked = useMemo(() => workedMs(db, key.workerId, todayKey(), buildIntervals(db), now), [db, key.workerId, now]);
  if (!w) return <div className="py-10 text-center text-muted-foreground">Сотрудник не найден на этом устройстве</div>;
  const info = [
    { label: "Зона", value: pres ? db.zones.find((z) => z.id === pres.zoneId)?.name ?? "—" : "—" },
    { label: "Смена", value: sh ? `${sh.start}–${sh.end}` : "нет" },
    { label: "Сегодня", value: durationRu(worked) },
  ];
  return (
    <motion.div variants={stagger()} initial="hidden" animate="show" className="flex flex-col gap-3">
      {/* Пропуск как физическая карточка */}
      <motion.article variants={fadeUp} className="overflow-hidden rounded-xl bg-card shadow-float">
        <div className="h-1.5 bg-brand-gradient" />
        <div className="flex items-center gap-3 px-5 pb-1 pt-4">
          <LogoMark className="size-7" />
          <div className="min-w-0 flex-1 text-xs text-muted-foreground"><div className="font-medium text-foreground">Пропуск на объект</div>ЖК «Северный» · корпус 2</div>
          {pres ? <Status tone="success" dot>На объекте</Status> : <Status dot>Не на объекте</Status>}
        </div>
        <div className="flex flex-col items-center px-5 pb-5 pt-4"><PassQr /></div>
        <div className="flex items-center gap-3 border-t border-dashed border-border-strong px-5 py-4">
          <Avatar name={w.fullName} photo={w.photo} className="size-12" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg font-semibold tracking-display">{w.fullName}</div>
            <div className="truncate text-sm text-muted-foreground">{w.position} · {w.contractor}</div>
          </div>
        </div>
      </motion.article>
      <motion.dl variants={fadeUp} className="grid grid-cols-3 rounded-lg bg-card shadow-card">
        {info.map(({ label, value }, i) => (
          <div key={label} className={`flex min-w-0 flex-col gap-0.5 px-3 py-3.5 sm:px-4 ${i ? "border-l border-border" : ""}`}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="truncate text-sm font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </motion.dl>
      <motion.p variants={fadeUp} className="px-2 text-center text-xs text-muted-foreground">
        {!online && "Нет сети, но пропуск работает: код подписывается на телефоне, терминал проверит его сам. "}
        {pres ? `Вход в ${hhmm(pres.since)}. При выходе предъявите QR-код ещё раз.` : "Предъявите код камере киоска. Код одноразовый и действует 30 секунд, поэтому скриншот не подойдёт."}
      </motion.p>
    </motion.div>
  );
};
