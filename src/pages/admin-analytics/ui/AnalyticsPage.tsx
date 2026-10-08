import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, Cell, Legend } from "recharts";
import { Info } from "lucide-react";
import { useDb, dailyStats, lastDays, loadByHour, refusalsByCode, REASONS } from "@/shared/api";
import { Card, CardHeader, CardTitle, Dialog, Segmented, Button } from "@/shared/ui";
import { atTime } from "@/shared/lib";
import { cssVar } from "@/shared/config/tokens";
import { PageHeader } from "@/widgets/admin-shell";

const axis = { stroke: cssVar("muted-foreground"), fontSize: 12, tickLine: false, axisLine: false } as const;
const tip = { contentStyle: { background: cssVar("popover"), border: `1px solid ${cssVar("border")}`, borderRadius: 14, color: cssVar("popover-foreground") }, cursor: { fill: cssVar("muted") } } as const;

const HOW = [
  ["Отработано", "Σ пересечений интервалов [вход, выход] со сменой ± допуск. Вход без выхода считается до текущего момента."],
  ["Опоздание", "первый вход позже начала смены больше чем на 5 минут"],
  ["Переработка", "последний выход позже конца смены больше чем на 5 минут"],
  ["Отказы", "делим на правомерные (правила, чужое лицо, повтор QR) и системные (кадр плохого качества, лицо не найдено) — вторые говорят о качестве самой системы"],
  ["Нагрузка", "успешные входы и выходы по часу события"],
];

export const AnalyticsPage = () => {
  const db = useDb();
  const [days, setDays] = useState<"7" | "14">("7");
  const [how, setHow] = useState(false);
  const range = useMemo(() => lastDays(Number(days)), [days]);
  const from = atTime(range[0], "00:00");
  const stats = useMemo(() => dailyStats(db, range).map((d) => ({ ...d, label: d.day.slice(8) + "." + d.day.slice(5, 7) })), [db, range]);
  const load = useMemo(() => loadByHour(db, from).filter((h) => h.hour >= 5 && h.hour <= 23), [db, from]);
  const refusals = useMemo(() => refusalsByCode(db, from).map((r) => ({ ...r, name: REASONS[r.code].message })), [db, from]);
  const total = stats.reduce((s, d) => s + d.attempts, 0);
  const deny = stats.reduce((s, d) => s + d.deny, 0);
  const sys = stats.reduce((s, d) => s + d.denySystem, 0);

  return (
    <div>
      <PageHeader title="Аналитика" sub="Только по реальным событиям журнала" actions={<><Segmented value={days} onChange={setDays} options={[{ value: "7", label: "7 дней" }, { value: "14", label: "14 дней" }]} /><Button variant="outline" size="sm" onClick={() => setHow(true)}><Info />Как посчитано</Button></>} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Часов отработано", Math.round(stats.reduce((s, d) => s + d.hours, 0))],
          ["Попыток прохода", total],
          ["Доля отказов", total ? `${Math.round((deny / total) * 100)}%` : "—"],
          ["Из них системных", deny ? `${Math.round((sys / deny) * 100)}%` : "—"],
        ].map(([l, v]) => <Card key={l} className="p-5"><div className="text-sm text-muted-foreground">{l}</div><div className="mt-2 font-display text-3xl font-semibold tabular-nums">{v}</div></Card>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Отработано часов по дням</CardTitle></CardHeader>
          <div className="h-72 p-3"><ResponsiveContainer><BarChart data={stats}><CartesianGrid vertical={false} stroke={cssVar("border")} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} width={36} /><Tooltip {...tip} /><Bar dataKey="hours" name="часы" fill={cssVar("chart-1")} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Нагрузка на проходную по часам</CardTitle></CardHeader>
          <div className="h-72 p-3"><ResponsiveContainer><AreaChart data={load}><CartesianGrid vertical={false} stroke={cssVar("border")} /><XAxis dataKey="hour" {...axis} /><YAxis {...axis} width={36} /><Tooltip {...tip} /><Legend />
            <Area type="monotone" dataKey="in" name="входы" stroke={cssVar("chart-1")} fill={cssVar("chart-1")} fillOpacity={0.25} strokeWidth={2} />
            <Area type="monotone" dataKey="out" name="выходы" stroke={cssVar("chart-2")} fill={cssVar("chart-2")} fillOpacity={0.2} strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Отказы по причинам</CardTitle></CardHeader>
          <div className="h-80 p-3"><ResponsiveContainer><BarChart data={refusals} layout="vertical" margin={{ left: 8 }}><XAxis type="number" {...axis} allowDecimals={false} /><YAxis type="category" dataKey="name" {...axis} width={180} /><Tooltip {...tip} />
            <Bar dataKey="count" name="отказы" radius={[0, 8, 8, 0]}>{refusals.map((r) => <Cell key={r.code} fill={r.system ? cssVar("chart-4") : cssVar("destructive")} />)}</Bar></BarChart></ResponsiveContainer></div>
          <div className="flex gap-4 px-5 pb-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="size-3 rounded-xs bg-destructive" />правомерные</span><span className="flex items-center gap-2"><span className="size-3 rounded-xs bg-chart-4" />системные</span></div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Опоздания и переработки</CardTitle></CardHeader>
          <div className="h-80 p-3"><ResponsiveContainer><BarChart data={stats}><CartesianGrid vertical={false} stroke={cssVar("border")} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} width={36} allowDecimals={false} /><Tooltip {...tip} /><Legend />
            <Bar dataKey="late" name="опоздания" fill={cssVar("warning")} radius={[6, 6, 0, 0]} /><Bar dataKey="overtime" name="переработки" fill={cssVar("chart-2")} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
      </div>
      <Dialog open={how} onClose={() => setHow(false)} title="Как посчитано">
        <dl className="flex flex-col gap-3 text-sm">{HOW.map(([k, v]) => <div key={k}><dt className="font-semibold">{k}</dt><dd className="text-muted-foreground">{v}</dd></div>)}</dl>
      </Dialog>
    </div>
  );
};
