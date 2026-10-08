import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { api, useDb, buildIntervals } from "@/shared/api";
import { Avatar, Button, Card, Dialog, Field, Input, Select, toast } from "@/shared/ui";
import { atTime, todayKey, weekdayRu, durationRu, cn } from "@/shared/lib";
import { useNow } from "@/shared/hooks";
import { PageHeader } from "@/widgets/admin-shell";
import { spring } from "@/shared/config/motion";

const FROM = 6, TO = 24;
const pct = (ts: number, day: string) => Math.max(0, Math.min(100, ((ts - atTime(day, `${String(FROM).padStart(2, "0")}:00`)) / ((TO - FROM) * 3600000)) * 100));

export const ShiftsPage = () => {
  const db = useDb();
  const now = useNow(60000);
  const [day, setDay] = useState(todayKey());
  const [edit, setEdit] = useState<{ workerId: string; start: string; end: string } | null>(null);
  const shift = (d: number) => { const x = new Date(atTime(day, "12:00")); x.setDate(x.getDate() + d); setDay(todayKey(x)); };
  const intervals = useMemo(() => buildIntervals(db), [db]);
  const rows = db.workers.map((w) => ({ w, s: db.shifts.find((x) => x.workerId === w.id && x.day === day), iv: intervals.filter((i) => i.workerId === w.id && (todayKey(new Date(i.start)) === day)) }));

  return (
    <div>
      <PageHeader title="Смены" sub="Плановая смена — серым, фактическое присутствие — зелёным"
        actions={<div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Назад" onClick={() => shift(-1)}><ChevronLeft /></Button>
          <span className="min-w-36 text-center font-semibold capitalize">{weekdayRu(atTime(day, "12:00"))}</span>
          <Button variant="outline" size="icon" aria-label="Вперёд" onClick={() => shift(1)}><ChevronRight /></Button></div>} />
      <Card className="overflow-x-auto">
        <div className="min-w-3xl">
          <div className="flex border-b border-border/60 py-2 pr-4 text-xs text-muted-foreground">
            <div className="w-64 shrink-0" />
            {Array.from({ length: (TO - FROM) / 2 }, (_, i) => <div key={i} className="flex-1">{String(FROM + i * 2).padStart(2, "0")}:00</div>)}
          </div>
          {rows.map(({ w, s, iv }) => (
            <div key={w.id} className="flex items-center border-b border-border/60 last:border-0">
              <button className="flex w-64 shrink-0 items-center gap-3 px-4 py-2 text-left hover:bg-muted" onClick={() => setEdit({ workerId: w.id, start: s?.start ?? "08:00", end: s?.end ?? "17:00" })}>
                <Avatar name={w.fullName} photo={w.photo} className="size-8 text-xs" />
                <div className="min-w-0"><div className="truncate text-sm font-medium">{w.fullName}</div><div className="text-xs text-muted-foreground">{s ? `${s.start}–${s.end}` : "нет смены"}</div></div>
              </button>
              <div className="relative mr-4 h-10 flex-1">
                {s && <div className="absolute inset-y-2 rounded-sm bg-secondary" style={{ left: `${pct(atTime(day, s.start), day)}%`, width: `${pct(atTime(day, s.end), day) - pct(atTime(day, s.start), day)}%` }} />}
                {iv.map((i, k) => (
                  <motion.div key={k} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={spring.soft} title={durationRu((i.end ?? now) - i.start)}
                    className={cn("absolute inset-y-3 origin-left rounded-full", i.end ? "bg-brand/60" : "bg-brand")}
                    style={{ left: `${pct(i.start, day)}%`, width: `${Math.max(0.5, pct(i.end ?? now, day) - pct(i.start, day))}%` }} />
                ))}
                {day === todayKey() && <div className="absolute inset-y-0 w-0.5 bg-destructive/60" style={{ left: `${pct(now, day)}%` }} />}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Dialog open={!!edit} onClose={() => setEdit(null)} title="Смена">
        {edit && (
          <div className="flex flex-col gap-4">
            <Field label="Сотрудник"><Select value={edit.workerId} onChange={(e) => setEdit({ ...edit, workerId: e.target.value })}>{db.workers.map((w) => <option key={w.id} value={w.id}>{w.fullName}</option>)}</Select></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Начало"><Input type="time" value={edit.start} onChange={(e) => setEdit({ ...edit, start: e.target.value })} /></Field>
              <Field label="Конец"><Input type="time" value={edit.end} onChange={(e) => setEdit({ ...edit, end: e.target.value })} /></Field>
            </div>
            <div className="flex justify-between">
              {(() => { const s = db.shifts.find((x) => x.workerId === edit.workerId && x.day === day); return s ? <Button variant="ghost" onClick={() => api.deleteShift(s.id).then(() => { setEdit(null); toast.info("Смена удалена"); })}><Trash2 />Удалить</Button> : <span />; })()}
              <Button disabled={edit.start >= edit.end} onClick={() => api.upsertShift({ workerId: edit.workerId, day, start: edit.start, end: edit.end }).then(() => { setEdit(null); toast.success("Смена сохранена"); })}><Plus />Сохранить</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
