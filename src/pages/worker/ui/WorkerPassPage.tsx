import { useMemo } from "react";
import { Link, useOutletContext } from "react-router";
import { motion } from "motion/react";
import { Building2, ChevronRight } from "lucide-react";
import { useDb, presenceNow, shiftFor, workedMs, buildIntervals, workerSites, siteOfZone } from "@/shared/api";
import { Avatar, PageHeader } from "@/shared/ui";
import { durationRu, hhmm, todayKey, cn, plural } from "@/shared/lib";
import { useNow, useOnline } from "@/shared/hooks";
import { routes } from "@/shared/const/router";
import { PassQr } from "@/features/show-pass-qr";
import type { WorkerCtx } from "@/widgets/worker-shell";
import { fadeUp, stagger } from "@/shared/config/motion";
import { useWorkerCard } from "../lib/card";

const todayRu = () => new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
const Tag = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("inline-flex min-w-0 items-center gap-1.5 truncate rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium", className)}>{children}</span>
);

export const WorkerPassPage = () => {
  const { key } = useOutletContext<WorkerCtx>();
  const db = useDb();
  const now = useNow(30000);
  const online = useOnline();
  const w = useWorkerCard(db.workers.find((x) => x.id === key.workerId), key.workerId);
  const pres = useMemo(() => presenceNow(db).find((p) => p.workerId === key.workerId), [db, key.workerId]);
  const sh = shiftFor(db, key.workerId);
  const worked = useMemo(() => workedMs(db, key.workerId, todayKey(), buildIntervals(db), now), [db, key.workerId, now]);
  const sites = useMemo(() => workerSites(db, key.workerId), [db, key.workerId]);
  if (!w) return <div className="py-10 text-center text-muted-foreground">Сотрудник не найден на этом устройстве</div>;

  const here = pres ? siteOfZone(db, pres.zoneId) : undefined;
  const zoneName = pres ? db.zones.find((z) => z.id === pres.zoneId)?.name : undefined;
  const stats = [
    { label: "Смена", value: sh ? `${sh.start}–${sh.end}` : "Нет смены" },
    { label: "Вход", value: pres ? hhmm(pres.since) : "—" },
    { label: "Сегодня", value: durationRu(worked) },
  ];

  return (
    <div>
      <PageHeader kicker={<span className="first-letter:uppercase">{todayRu()}</span>} title="Пропуск"
        sub={!online ? "Нет сети, но пропуск работает: код подписывается на телефоне" : pres ? `Вы на объекте с ${hhmm(pres.since)}. На выходе покажите код ещё раз` : "Покажите код камере терминала на проходной"} />

      <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="flex flex-col gap-3 sm:gap-4">
        {/* Пропуск: владелец — во врезке с фирменной заливкой, ниже код и сегодняшние цифры. Врезка не заходит на код. */}
        <motion.article variants={fadeUp} className="overflow-hidden rounded-xl bg-card shadow-float">
          <div className="p-2">
            <div className="relative isolate overflow-hidden rounded-lg bg-brand-deep p-4 text-white">
              <span aria-hidden className="absolute inset-0 -z-10 bg-sheen" />
              <div className="flex items-center gap-3">
                <Avatar name={w.fullName} photo={w.photo} className="size-12 ring-2 ring-white/40" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-lg font-semibold tracking-display">{w.fullName}</div>
                  <div className="truncate text-sm text-white/80">{w.position} · {w.contractor}</div>
                </div>
              </div>
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                <Tag><span className={cn("size-1.5 shrink-0 rounded-full", pres ? "bg-white" : "bg-white/50")} />{pres ? `На объекте · ${zoneName ?? ""}` : "Не на объекте"}</Tag>
                <Link to={routes.workerProfile} className="min-w-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <Tag className="transition-colors duration-fast hover:bg-white/25"><Building2 className="size-3.5 shrink-0" />{here?.name ?? `${sites.length} ${plural(sites.length, "объект", "объекта", "объектов")}`}<ChevronRight className="-mr-1 size-3.5 shrink-0" /></Tag>
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center px-5 pb-5 pt-3 sm:px-6"><PassQr /></div>
          <dl className="grid grid-cols-4 border-t border-dashed border-border-strong">
            {stats.map(({ label, value }, i) => (
              <div key={label} className={cn("flex min-w-0 flex-col gap-0.5 px-3 py-3.5 sm:px-5", i ? "border-l border-border" : "col-span-2")}>
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
