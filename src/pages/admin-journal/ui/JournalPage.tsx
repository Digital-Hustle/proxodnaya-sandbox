import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { Download, ScrollText, Search } from "lucide-react";
import { useDb, REASONS, SYSTEM_CODES, type Decision } from "@/shared/api";
import { Status, Button, Card, EmptyState, Input, Select, PageHeader } from "@/shared/ui";
import { AttemptRow, DecisionBadge, decisionView } from "@/entities/pass";
import { dayKey, hhmmss, dateRu, todayKey } from "@/shared/lib";

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
      <PageHeader title="Журнал проходов" sub="Все попытки прохода с решением и причиной. Фильтры сохраняются в адресе страницы" actions={<Button variant="secondary" onClick={download}><Download />Скачать CSV</Button>} />
      <div className="mb-3 grid gap-2 sm:mb-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="min-w-0 sm:col-span-3 lg:col-span-2"><Input icon={<Search />} value={q} onChange={(e) => set("q", e.target.value)} placeholder="Сотрудник или причина" aria-label="Поиск" className="bg-card" /></div>
          <Select aria-label="День" value={day} onChange={(v) => set("day", v)} className="bg-card"
            options={[{ value: "all", label: "Все дни" }, ...days.map((d) => ({ value: d, label: d === todayKey() ? "Сегодня" : dateRu(new Date(d).getTime()) }))]} />
          <Select aria-label="Решение" value={decision} onChange={(v) => set("decision", v)} className="bg-card"
            options={[{ value: "", label: "Все решения" }, ...(["ALLOW", "DENY", "MANUAL", "ERROR"] as Decision[]).map((d) => ({ value: d, label: decisionView[d].label }))]} />
          <Select aria-label="Направление" value={direction} onChange={(v) => set("dir", v)} className="bg-card"
            options={[{ value: "", label: "Вход и выход" }, { value: "IN", label: "Только вход" }, { value: "OUT", label: "Только выход" }]} />
      </div>
      <Card className="overflow-hidden">
        {list.length === 0 ? <EmptyState icon={<ScrollText />} title="Записей нет" text="Попробуйте другой день или сбросьте фильтры" /> : (<>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr className="border-b border-border">{["Время", "Сотрудник", "Проходная", "Направление", "Решение", "Причина", "Сходство"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-medium first:pl-6 last:pr-6">{h}</th>)}</tr></thead>
              <tbody>
                {list.slice(0, 300).map((a) => (
                  <tr key={a.id} className="border-b border-border transition-colors duration-fast last:border-0 hover:bg-muted">
                    <td className="whitespace-nowrap px-4 py-3 pl-6 tabular-nums text-muted-foreground">{day === "all" ? `${dateRu(a.ts)} ` : ""}{hhmmss(a.ts)}</td>
                    <td className="px-4 py-3 font-medium">{name(a.workerId)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cp(a.checkpointId)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.direction === "IN" ? "вход" : "выход"}</td>
                    <td className="px-4 py-3"><DecisionBadge decision={a.decision} /></td>
                    <td className="px-4 py-3">{a.decision === "ALLOW" ? <span className="text-subtle-foreground">—</span> : <span className="flex flex-wrap items-center gap-2">{REASONS[a.code].message}{SYSTEM_CODES.has(a.code) && <Status tone="info">системный</Status>}</span>}{a.note && <span className="text-muted-foreground"> · {a.note}</span>}</td>
                    <td className="px-4 py-3 pr-6 tabular-nums text-muted-foreground">{a.score ? `${Math.round(a.score * 100)}%` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-border px-4 sm:px-6 lg:hidden">{list.slice(0, 150).map((a) => <AttemptRow key={a.id} a={a} showDate={day === "all"} who={<div className="truncate text-sm font-medium">{name(a.workerId)}</div>} />)}</div>
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-6">Показано {Math.min(list.length, 300)} из {list.length}</div>
        </>)}
      </Card>
    </div>
  );
};
