import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Trash2, Pencil } from "lucide-react";
import { api, useDb, buildIntervals } from "@/shared/api";
import { Avatar, Button, Card, Dialog, Field, Input, Select, toast, PageHeader } from "@/shared/ui";
import { atTime, todayKey, durationRu, cn } from "@/shared/lib";
import { useNow } from "@/shared/hooks";
import { spring, fadeUp, stagger } from "@/shared/config/motion";

const FROM = 6, TO = 24;
const HOURS = [6, 9, 12, 15, 18, 21];
const pct = (ts: number, day: string) => Math.max(0, Math.min(100, ((ts - atTime(day, `${String(FROM).padStart(2, "0")}:00`)) / ((TO - FROM) * 3600000)) * 100));
const dayTitle = (day: string) => new Date(atTime(day, "12:00")).toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" });

const Track = ({ day, s, iv, now }: { day: string; s?: { start: string; end: string }; iv: { start: number; end?: number }[]; now: number }) => (
  <div className="relative h-8 min-w-0 flex-1 rounded-sm bg-muted">
    {HOURS.map((h) => <span key={h} className="absolute inset-y-0 w-px bg-border" style={{ left: `${((h - FROM) / (TO - FROM)) * 100}%` }} />)}
    {s && <div className="absolute inset-y-1 rounded-xs border border-dashed border-border-strong bg-card" style={{ left: `${pct(atTime(day, s.start), day)}%`, width: `${pct(atTime(day, s.end), day) - pct(atTime(day, s.start), day)}%` }} />}
    {iv.map((i, k) => (
      <motion.div key={k} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ ...spring.bar, delay: k * 0.05 }} title={durationRu((i.end ?? now) - i.start)}
        className={cn("absolute inset-y-2.5 origin-left rounded-full", i.end ? "bg-brand/70" : "bg-brand-gradient")}
        style={{ left: `${pct(i.start, day)}%`, width: `${Math.max(0.8, pct(i.end ?? now, day) - pct(i.start, day))}%` }} />
    ))}
    {day === todayKey() && <div className="absolute -inset-y-1 w-0.5 rounded-full bg-danger" style={{ left: `${pct(now, day)}%` }} />}
  </div>
);

export const ShiftsPage = () => {
  const db = useDb();
  const now = useNow(60000);
  const [day, setDay] = useState(todayKey());
  const [edit, setEdit] = useState<{ workerId: string; start: string; end: string } | null>(null);
  const shift = (d: number) => { const x = new Date(atTime(day, "12:00")); x.setDate(x.getDate() + d); setDay(todayKey(x)); };
  const intervals = useMemo(() => buildIntervals(db), [db]);
  const rows = db.workers.map((w) => ({ w, s: db.shifts.find((x) => x.workerId === w.id && x.day === day), iv: intervals.filter((i) => i.workerId === w.id && (todayKey(new Date(i.start)) === day)) }));
  const existing = edit ? db.shifts.find((x) => x.workerId === edit.workerId && x.day === day) : undefined;

  return (
    <div>
      <PageHeader title="Смены" sub="Пунктир — плановая смена, зелёная полоса — фактическое присутствие"
        actions={
          <div className="flex items-center gap-1 rounded-md bg-card p-1 shadow-xs">
            <Button variant="quiet" size="icon-sm" aria-label="Предыдущий день" onClick={() => shift(-1)}><ChevronLeft /></Button>
            <span className="min-w-36 px-2 text-center text-sm font-medium first-letter:uppercase">{day === todayKey() ? "Сегодня" : dayTitle(day)}</span>
            <Button variant="quiet" size="icon-sm" aria-label="Следующий день" onClick={() => shift(1)}><ChevronRight /></Button>
          </div>
        } />
      <Card className="overflow-hidden">
        <div className="flex items-end border-b border-border px-4 pb-2 pt-4 sm:px-6">
          <div className="hidden w-60 shrink-0 text-xs text-muted-foreground md:block">Сотрудник</div>
          <div className="relative h-4 min-w-0 flex-1 text-xs tabular-nums text-muted-foreground">
            {HOURS.map((h) => <span key={h} className="absolute -translate-x-1/2 first:translate-x-0" style={{ left: `${((h - FROM) / (TO - FROM)) * 100}%` }}>{String(h).padStart(2, "0")}:00</span>)}
          </div>
        </div>
        <motion.ul variants={stagger(0.02)} initial="hidden" animate="show">
          {rows.map(({ w, s, iv }) => (
            <motion.li key={w.id} variants={fadeUp} className="border-b border-border last:border-0">
              <button type="button" onClick={() => setEdit({ workerId: w.id, start: s?.start ?? "08:00", end: s?.end ?? "17:00" })}
                className="group flex w-full min-w-0 flex-col gap-2 px-4 py-3 text-left transition-colors duration-fast hover:bg-muted sm:px-6 md:flex-row md:items-center md:gap-0">
                <div className="flex min-w-0 items-center gap-3 md:w-60 md:shrink-0 md:pr-4">
                  <Avatar name={w.fullName} photo={w.photo} className="size-8 text-xs" />
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{w.fullName}</div><div className="text-xs tabular-nums text-muted-foreground">{s ? `${s.start}–${s.end}` : "нет смены"}</div></div>
                  <Pencil className="size-4 shrink-0 text-subtle-foreground opacity-0 transition-opacity duration-fast group-hover:opacity-100" />
                </div>
                <Track day={day} s={s} iv={iv} now={now} />
              </button>
            </motion.li>
          ))}
        </motion.ul>
      </Card>
      <Dialog open={!!edit} onClose={() => setEdit(null)} title="Смена" description={dayTitle(day)}
        footer={edit && (<>
          {existing && <Button variant="danger-soft" className="sm:mr-auto" onClick={() => api.deleteShift(existing.id).then(() => { setEdit(null); toast.info("Смена удалена"); })}><Trash2 />Удалить</Button>}
          <Button disabled={edit.start >= edit.end} onClick={() => api.upsertShift({ workerId: edit.workerId, day, start: edit.start, end: edit.end }).then(() => { setEdit(null); toast.success("Смена сохранена"); })}>Сохранить</Button>
        </>)}>
        {edit && (
          <div className="flex flex-col gap-5">
            <Field label="Сотрудник"><Select value={edit.workerId} onChange={(v) => setEdit({ ...edit, workerId: v })} options={db.workers.map((w) => ({ value: w.id, label: w.fullName, hint: w.position }))} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Начало"><Input type="time" value={edit.start} onChange={(e) => setEdit({ ...edit, start: e.target.value })} /></Field>
              <Field label="Конец" error={edit.start >= edit.end ? "Позже начала" : null}><Input type="time" value={edit.end} onChange={(e) => setEdit({ ...edit, end: e.target.value })} /></Field>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
