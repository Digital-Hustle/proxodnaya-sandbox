import { useMemo } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { HardHat, DoorOpen, ShieldX, AlarmClock, UserPlus, ScanLine, Lightbulb } from "lucide-react";
import { useDb, presenceNow, dailyStats } from "@/shared/api";
import { Button, Card, CardHeader, CardTitle, Badge } from "@/shared/ui";
import { todayKey, plural } from "@/shared/lib";
import { routes } from "@/shared/const/router";
import { fadeUp, stagger, spring } from "@/shared/config/motion";
import { PageHeader } from "@/widgets/admin-shell";
import { OnSiteNow } from "@/widgets/on-site";
import { LiveFeed } from "@/widgets/live-feed";


export const DashboardPage = () => {
  const db = useDb();
  const presence = useMemo(() => presenceNow(db), [db]);
  const [today] = useMemo(() => dailyStats(db, [todayKey()]), [db]);
  const cap = db.zones.reduce((s, z) => s + z.capacity, 0);
  const insights = useMemo(() => {
    const out: { tone: "warning" | "danger" | "info"; text: string }[] = [];
    for (const z of db.zones) {
      const n = presence.filter((p) => p.zoneId === z.id).length;
      if (n > z.capacity * 0.8) out.push({ tone: "warning", text: `${z.name}: ${n} из ${z.capacity} — почти заполнено` });
    }
    const expired = db.workers.filter((w) => w.permitUntil < todayKey());
    if (expired.length) out.push({ tone: "danger", text: `${expired.length} ${plural(expired.length, "сотрудник", "сотрудника", "сотрудников")} с просроченным допуском — киоск их не пустит` });
    if (today.denySystem > 2) out.push({ tone: "info", text: `Сегодня ${today.denySystem} системных отказов (качество кадра) — проверьте свет у камеры` });
    if (today.late) out.push({ tone: "info", text: `Опоздали сегодня: ${today.late}. Подробности — в помощнике` });
    return out;
  }, [db, presence, today]);

  const kpi = [
    { icon: HardHat, label: "На объекте", value: presence.length, sub: `из ${cap} мест` },
    { icon: DoorOpen, label: "Проходов сегодня", value: today.allow, sub: `${today.attempts} попыток` },
    { icon: ShieldX, label: "Отказов сегодня", value: today.deny, sub: `${today.denySystem} системных` },
    { icon: AlarmClock, label: "Опоздали", value: today.late, sub: `${today.overtime} переработок` },
  ];

  return (
    <div>
      <PageHeader title="Обстановка" sub="Обновляется сама, когда кто-то проходит через киоск"
        actions={<><Link to={routes.kiosk} target="_blank"><Button variant="outline"><ScanLine />Открыть киоск</Button></Link><Link to={routes.adminPersonNew}><Button><UserPlus />Новый сотрудник</Button></Link></>} />
      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpi.map(({ icon: Icon, label, value, sub }) => (
          <motion.div key={label} variants={fadeUp}>
            <Card className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-center justify-between text-sm text-muted-foreground">{label}<Icon className="size-5 text-brand" /></div>
              <motion.div key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring.snappy} className="font-display text-3xl font-semibold tabular-nums">{value}</motion.div>
              <div className="text-xs text-muted-foreground">{sub}</div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Сейчас на объекте</CardTitle><Badge tone="success">{presence.length}</Badge></CardHeader>
          <div className="flex flex-col gap-3 px-5 pt-4">
            {db.zones.map((z) => {
              const n = presence.filter((p) => p.zoneId === z.id).length;
              return (
                <div key={z.id} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 text-muted-foreground">{z.name}</span>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"><motion.div className="h-full origin-left rounded-full bg-brand" initial={{ scaleX: 0 }} animate={{ scaleX: Math.min(1, n / z.capacity) }} transition={spring.soft} /></div>
                  <span className="w-12 shrink-0 text-right tabular-nums">{n}/{z.capacity}</span>
                </div>
              );
            })}
          </div>
          <OnSiteNow />
        </Card>
        <div className="flex flex-col gap-4 lg:col-span-2">
          {insights.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="size-5 text-brand" />Помощник заметил</CardTitle></CardHeader>
              <div className="flex flex-col gap-2 p-5">{insights.map((i) => <div key={i.text} className="flex items-start gap-2 text-sm"><Badge tone={i.tone}>!</Badge>{i.text}</div>)}</div>
            </Card>
          )}
          <Card className="overflow-hidden">
            <CardHeader><CardTitle>Последние проходы</CardTitle><Link to={routes.adminJournal} className="text-sm font-medium text-accent-foreground">Весь журнал</Link></CardHeader>
            <div className="pt-2"><LiveFeed limit={7} /></div>
          </Card>
        </div>
      </div>
    </div>
  );
};
