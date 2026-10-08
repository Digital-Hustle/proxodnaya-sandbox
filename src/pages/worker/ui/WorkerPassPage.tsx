import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router";
import { motion } from "motion/react";
import { Building2, ShieldCheck } from "lucide-react";
import { useDb, presenceNow, shiftFor, workedMs, buildIntervals, workerSites, siteOfZone } from "@/shared/api";
import { Avatar, Card, CardHeader, CardTitle, PageHeader, Status } from "@/shared/ui";
import { durationRu, hhmm, todayKey, cn, plural } from "@/shared/lib";
import { useNow, useOnline } from "@/shared/hooks";
import { PassQr } from "@/features/show-pass-qr";
import type { WorkerCtx } from "@/widgets/worker-shell";
import { fadeUp, stagger } from "@/shared/config/motion";

// ADR-043: карточка пропуска хранится на телефоне — без сети приложение открывается из кэша и показывает её вместе с QR.
const CARD = "proxodnaya.worker.card";
type CardData = { id: string; fullName: string; position: string; contractor: string; photo?: string };
const readCard = (id: string): CardData | undefined => {
  try { const c = JSON.parse(localStorage.getItem(CARD) ?? "null") as CardData | null; return c?.id === id ? c : undefined; } catch { return undefined; }
};
const todayRu = () => new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
const greet = (h = new Date().getHours()) => (h < 5 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер");

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
  const sites = useMemo(() => workerSites(db, key.workerId), [db, key.workerId]);
  if (!w) return <div className="py-10 text-center text-muted-foreground">Сотрудник не найден на этом устройстве</div>;

  const here = pres ? siteOfZone(db, pres.zoneId) : undefined;
  const zoneName = pres ? db.zones.find((z) => z.id === pres.zoneId)?.name : undefined;
  const firstName = w.fullName.split(" ").slice(1).join(" ") || w.fullName;
  const stats = [
    { label: "Смена", value: sh ? `${sh.start}–${sh.end}` : "Нет смены" },
    { label: "Вход", value: pres ? hhmm(pres.since) : "—" },
    { label: "Сегодня", value: durationRu(worked) },
  ];

  return (
    <div>
      <PageHeader kicker={<span className="first-letter:uppercase">{todayRu()}</span>} title={`${greet()}, ${firstName}`}
        sub={pres ? `Вы на объекте с ${hhmm(pres.since)}. На выходе покажите код ещё раз` : "Покажите код камере терминала на проходной"} />

      <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="flex flex-col gap-3 sm:gap-4">
        {/* Пропуск: фирменная шапка с владельцем, под ней — код на белой плашке и сегодняшние цифры */}
        <motion.article variants={fadeUp} className="overflow-hidden rounded-xl bg-card shadow-float">
          <div className="relative isolate overflow-hidden bg-brand-deep px-5 pb-16 pt-5 text-white sm:px-6">
            <span aria-hidden className="absolute inset-0 -z-10 bg-sheen" />
            <div className="flex items-center gap-3">
              <Avatar name={w.fullName} photo={w.photo} className="size-12 ring-2 ring-white/40" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-lg font-semibold tracking-display">{w.fullName}</div>
                <div className="truncate text-sm text-white/80">{w.position} · {w.contractor}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
                <span className={cn("size-1.5 rounded-full", pres ? "bg-white" : "bg-white/50")} />{pres ? `На объекте · ${zoneName ?? ""}` : "Не на объекте"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1"><ShieldCheck className="size-3.5" />{here?.name ?? `${sites.length} ${plural(sites.length, "объект", "объекта", "объектов")}`}</span>
            </div>
          </div>
          <div className="relative -mt-12 flex flex-col items-center px-5 pb-5 sm:px-6"><PassQr /></div>
          <dl className="grid grid-cols-4 border-t border-dashed border-border-strong">
            {stats.map(({ label, value }, i) => (
              <div key={label} className={cn("flex min-w-0 flex-col gap-0.5 px-3 py-3.5 sm:px-5", i ? "border-l border-border" : "col-span-2")}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="truncate text-sm font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </motion.article>

        {/* ADR-044: один код на все объекты — терминал каждого объекта сам проверяет допуск к своим зонам */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader><CardTitle>Мои объекты</CardTitle><Status tone="success" dot>{sites.length}</Status></CardHeader>
            <ul className="flex flex-col gap-1 p-2 sm:p-3">
              {sites.map(({ site, zones }) => {
                const on = here?.id === site.id;
                return (
                  <li key={site.id} className={cn("flex min-w-0 items-center gap-3 rounded-md p-2.5", on && "bg-accent")}>
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-sm", on ? "bg-brand text-white" : "bg-surface text-muted-foreground")}><Building2 className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{site.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{zones.map((z) => z.name).join(" · ")}</div>
                    </div>
                    {on && <Status tone="success" dot>Вы здесь</Status>}
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-6">
              Один QR на все объекты: терминал на проходной сам проверит допуск к своим зонам. Переключать ничего не нужно.
            </p>
          </Card>
        </motion.div>

        <motion.p variants={fadeUp} className="px-2 text-center text-xs text-muted-foreground">
          {!online && "Нет сети, но пропуск работает: код подписывается на телефоне, терминал проверит его сам. "}
          Код одноразовый и меняется каждые 30 секунд, поэтому скриншот не подойдёт.
        </motion.p>
      </motion.div>
    </div>
  );
};
