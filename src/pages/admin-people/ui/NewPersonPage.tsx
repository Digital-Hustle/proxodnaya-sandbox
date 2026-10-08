import { useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Check, ArrowLeft, ArrowRight, Timer } from "lucide-react";
import { api, useDb, type Worker } from "@/shared/api";
import { Button, Card, Field, Input, Select, toast } from "@/shared/ui";
import { cn, todayKey, hhmm } from "@/shared/lib";
import { useNow } from "@/shared/hooks";
import { routes } from "@/shared/const/router";
import { spring } from "@/shared/config/motion";
import { PhotoCapture } from "@/features/capture-photo";
import { PageHeader } from "@/widgets/admin-shell";
import { InviteCard } from "./InviteCard";

const STEPS = ["Данные", "Фото", "Смена", "Приглашение"];
const CONTRACTORS = ["Генподрядчик", "СтройМонтаж", "Бетон-Юг", "ЭлектроСеть", "ИнжСистемы", "ТехноКран"];

/** Заведение человека за ≤ 2 минуты (Д9): данные → фото → смена → инвайт. */
export const NewPersonPage = () => {
  const db = useDb();
  const nav = useNavigate();
  const now = useNow(1000);
  const [startedAt] = useState(Date.now);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("Монтажник");
  const [contractor, setContractor] = useState(CONTRACTORS[1]);
  const [zoneIds, setZoneIds] = useState<string[]>(["z_a", "z_b"]);
  const [photo, setPhoto] = useState<string>();
  const [shift, setShift] = useState(() => { const h = new Date().getHours(); return { start: hhmm(Date.now() - 30 * 60000).slice(0, 2) + ":00", end: `${String(Math.min(23, Math.max(h + 8, 17))).padStart(2, "0")}:00` }; });
  const [created, setCreated] = useState<Worker | null>(null);
  const [busy, setBusy] = useState(false);
  const live = created ? db.workers.find((w) => w.id === created.id) ?? created : null;
  const elapsed = Math.round(((created ? created.createdAt : now) - startedAt) / 1000);

  const go = (d: number) => { setDir(d); setStep((s) => s + d); };
  const finish = async () => {
    setBusy(true);
    const w = await api.createWorker({ fullName: fullName.trim(), position, contractor, zoneIds, photo });
    await api.upsertShift({ workerId: w.id, day: todayKey(), start: shift.start, end: shift.end });
    setCreated(w); setBusy(false); go(1);
    toast.success("Сотрудник заведён");
  };
  const canNext = [fullName.trim().split(/\s+/).length >= 2, true, shift.start < shift.end][step] ?? true;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Новый сотрудник" actions={<span className={cn("flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold tabular-nums", elapsed <= 120 ? "bg-accent text-accent-foreground" : "bg-warning/10 text-warning")}><Timer className="size-4" />{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} / цель 2:00</span>} />
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col gap-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted"><motion.div className="h-full origin-left bg-primary" animate={{ scaleX: i <= step ? 1 : 0 }} transition={spring.soft} /></div>
            <span className={cn("hidden text-xs font-medium sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>{i + 1}. {s}</span>
          </div>
        ))}
      </div>
      <Card className="overflow-hidden p-6">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} initial={{ x: dir * 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: dir * -40, opacity: 0 }} transition={spring.soft}>
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <Field label="ФИО"><Input autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Фамилия Имя Отчество" /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Должность"><Input value={position} onChange={(e) => setPosition(e.target.value)} /></Field>
                  <Field label="Подрядчик"><Select value={contractor} onChange={(e) => setContractor(e.target.value)}>{CONTRACTORS.map((c) => <option key={c}>{c}</option>)}</Select></Field>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Допуск в зоны</span>
                  <div className="flex flex-wrap gap-2">
                    {db.zones.map((z) => {
                      const on = zoneIds.includes(z.id);
                      return <button key={z.id} type="button" onClick={() => setZoneIds((v) => (on ? v.filter((x) => x !== z.id) : [...v, z.id]))}
                        className={cn("flex h-control-sm items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-fast", on ? "border-ring bg-accent text-accent-foreground" : "border-border text-muted-foreground")}>{on && <Check className="size-4" />}{z.name}</button>;
                    })}
                  </div>
                </div>
              </div>
            )}
            {step === 1 && <PhotoCapture value={photo} onChange={setPhoto} />}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">Смена на сегодня — без неё киоск не пустит (NO_SHIFT).</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Начало"><Input type="time" value={shift.start} onChange={(e) => setShift((s) => ({ ...s, start: e.target.value }))} /></Field>
                  <Field label="Конец"><Input type="time" value={shift.end} onChange={(e) => setShift((s) => ({ ...s, end: e.target.value }))} /></Field>
                </div>
              </div>
            )}
            {step === 3 && live && <InviteCard w={live} />}
          </motion.div>
        </AnimatePresence>
        <div className="mt-6 flex justify-between gap-2">
          {step > 0 && step < 3 ? <Button variant="ghost" onClick={() => go(-1)}><ArrowLeft />Назад</Button> : <span />}
          {step < 2 && <Button disabled={!canNext} onClick={() => go(1)}>{step === 1 && !photo ? "Без фото" : "Дальше"}<ArrowRight /></Button>}
          {step === 2 && <Button disabled={!canNext || busy} onClick={finish}>Создать и выдать QR<ArrowRight /></Button>}
          {step === 3 && live && <Button variant="outline" onClick={() => nav(routes.adminPerson(live.id))}>Карточка сотрудника</Button>}
        </div>
      </Card>
    </div>
  );
};
