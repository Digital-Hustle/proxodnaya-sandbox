import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { Download, ScrollText, Search } from "lucide-react";
import { useDb, REASONS, SYSTEM_CODES, type Decision } from "@/shared/api";
import { Badge, Button, Card, EmptyState, Input, Select } from "@/shared/ui";
import { AttemptRow, DecisionBadge } from "@/entities/pass";
import { dayKey, hhmmss, dateRu, todayKey } from "@/shared/lib";
import { PageHeader } from "@/widgets/admin-shell";

const csv = (rows: (string | number)[][]) => rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");

export const JournalPage = () => {
  const db = useDb();
  const [sp, setSp] = useSearchParams();
  const set = (k: string, v: string) => setSp((p) => { if (v) p.set(k, v); else p.delete(k); return p; }, { replace: true });
  const decision = sp.get("decision") ?? "";
  const direction = sp.get("dir") ?? "";
  const day = sp.get("day") ?? todayKey();
  const q = sp.get("q") ?? "";
  const name = (id?: string) => db.workers.find((w) => w.id === id)?.fullName ?? "Неизвестный пропуск";
  const cp = (id: string) => db.checkpoints.find((c) => c.id === id)?.name ?? id;

  const list = useMemo(() => db.attempts
    .filter((a) => (day === "all" || dayKey(a.ts) === day) && (!decision || a.decision === decision) && (!direction || a.direction === direction))
    .filter((a) => !q || `${name(a.workerId)} ${REASONS[a.code].message} ${a.code}`.toLowerCase().includes(q.toLowerCase()))
    .reverse(), [db, day, decision, direction, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(() => [...new Set(db.attempts.map((a) => dayKey(a.ts)))].sort().reverse(), [db]);
  const download = () => {
    const body = csv([["Дата", "Время", "Сотрудник", "Проходная", "Направление", "Решение", "Код", "Причина", "Сходство"], ...list.map((a) => [dayKey(a.ts), hhmmss(a.ts), name(a.workerId), cp(a.checkpointId), a.direction === "IN" ? "вход" : "выход", a.decision, a.code, REASONS[a.code].message, a.score ? a.score.toFixed(2) : ""])]);
    const url = URL.createObjectURL(new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" }));
    Object.assign(document.createElement("a"), { href: url, download: `journal-${day}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Журнал проходов" sub="Каждая попытка: кто, где, решение и почему. Фильтры — в адресе страницы" actions={<Button variant="outline" onClick={download}><Download />CSV</Button>} />
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => set("q", e.target.value)} placeholder="Сотрудник или причина" className="pl-12" /></div>
        <Select value={day} onChange={(e) => set("day", e.target.value)}><option value="all">Все дни</option>{days.map((d) => <option key={d} value={d}>{d === todayKey() ? "Сегодня" : dateRu(new Date(d).getTime())}</option>)}</Select>
        <Select value={decision} onChange={(e) => set("decision", e.target.value)}><option value="">Все решения</option>{(["ALLOW", "DENY", "MANUAL", "ERROR"] as Decision[]).map((d) => <option key={d} value={d}>{d}</option>)}</Select>
        <Select value={direction} onChange={(e) => set("dir", e.target.value)}><option value="">Вход и выход</option><option value="IN">Вход</option><option value="OUT">Выход</option></Select>
      </div>
      <Card className="overflow-hidden">
        {list.length === 0 ? <EmptyState icon={<ScrollText />} title="Записей нет" text="Попробуйте другой день или сбросьте фильтры" /> : (<>
          <table className="hidden w-full text-sm md:table">
            <thead className="bg-muted text-left text-muted-foreground"><tr>{["Время", "Сотрудник", "Проходная", "", "Решение", "Причина", "Сходство"].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {list.slice(0, 300).map((a) => (
                <tr key={a.id} className="border-t border-border/60 hover:bg-muted/50">
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{day === "all" ? `${dateRu(a.ts)} ` : ""}{hhmmss(a.ts)}</td>
                  <td className="px-4 py-3 font-medium">{name(a.workerId)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cp(a.checkpointId)}</td>
                  <td className="px-4 py-3">{a.direction === "IN" ? "вход" : "выход"}</td>
                  <td className="px-4 py-3"><DecisionBadge decision={a.decision} /></td>
                  <td className="px-4 py-3">{a.decision === "ALLOW" ? "—" : <span className="flex items-center gap-2">{REASONS[a.code].message}{SYSTEM_CODES.has(a.code) && <Badge tone="info">системный</Badge>}</span>}{a.note && <span className="text-muted-foreground"> · {a.note}</span>}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{a.score ? `${Math.round(a.score * 100)}%` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="divide-y divide-border/60 px-4 md:hidden">{list.slice(0, 150).map((a) => <AttemptRow key={a.id} a={a} showDate={day === "all"} who={<div className="truncate text-sm font-medium">{name(a.workerId)}</div>} />)}</div>
          <div className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">Показано {Math.min(list.length, 300)} из {list.length}</div>
        </>)}
      </Card>
    </div>
  );
};
