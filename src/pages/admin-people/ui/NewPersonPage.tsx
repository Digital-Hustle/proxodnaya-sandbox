import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Check, ArrowLeft, ArrowRight, Timer } from "lucide-react";
import { api, useDb, type Worker } from "@/shared/api";
import { Button, Card, Field, Input, Select, toast, PageHeader, Status } from "@/shared/ui";
import { cn, todayKey, hhmm } from "@/shared/lib";
import { useNow } from "@/shared/hooks";
import { routes } from "@/shared/const/router";
import { spring, tween, press } from "@/shared/config/motion";
import { PhotoCapture } from "@/features/capture-photo";
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
  const [touched, setTouched] = useState(false);
  const [position, setPosition] = useState("Монтажник");
  const [contractor, setContractor] = useState(CONTRACTORS[1]);
  const [zoneIds, setZoneIds] = useState<string[]>(["z_a", "z_b"]);
  const [photo, setPhoto] = useState<string>();
  const [shift, setShift] = useState(() => { const h = new Date().getHours(); return { start: hhmm(Date.now() - 30 * 60000).slice(0, 2) + ":00", end: `${String(Math.min(23, Math.max(h + 8, 17))).padStart(2, "0")}:00` }; });
  const [created, setCreated] = useState<Worker | null>(null);
  const [busy, setBusy] = useState(false);
  const live = created ? db.workers.find((w) => w.id === created.id) ?? created : null;
  const elapsed = Math.round(((created ? created.createdAt : now) - startedAt) / 1000);

  const nameOk = fullName.trim().split(/\s+/).length >= 2;
  const go = (d: number) => { setDir(d); setStep((s) => s + d); };
  const finish = async () => {
    setBusy(true);
    const w = await api.createWorker({ fullName: fullName.trim(), position, contractor, zoneIds, photo });
    await api.upsertShift({ workerId: w.id, day: todayKey(), start: shift.start, end: shift.end });
    setCreated(w); setBusy(false); go(1);
    toast.success("Сотрудник заведён");
  };
  const canNext = [nameOk && zoneIds.length > 0, true, shift.start < shift.end][step] ?? true;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Новый сотрудник" sub="Данные, фото, смена — и приглашение для телефона"
        actions={<Status tone={elapsed <= 120 ? "success" : "warning"} className="h-8 px-3 text-sm"><Timer /><span className="tabular-nums">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span><span className="opacity-70">/ цель 2:00</span></Status>} />

      <ol className="mb-4 grid grid-cols-4 gap-2 sm:mb-5" aria-label="Шаги">
        {STEPS.map((s, i) => (
          <li key={s} className="flex min-w-0 flex-col gap-2" aria-current={i === step ? "step" : undefined}>
            <div className="h-1 overflow-hidden rounded-full bg-surface"><motion.div className="h-full origin-left rounded-full bg-primary" initial={false} animate={{ scaleX: i <= step ? 1 : 0 }} transition={spring.bar} /></div>
            <span className={cn("truncate text-xs font-medium", i === step ? "text-foreground" : "text-muted-foreground", i !== step && "hidden sm:block")}>{i + 1}. {s}</span>
          </li>
        ))}
      </ol>

      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div key={step} custom={dir} initial={{ x: dir * 32, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: dir * -32, opacity: 0, transition: tween.exit }} transition={{ ...spring.soft, opacity: tween.fast }}>
              {step === 0 && (
                <div className="flex flex-col gap-5">
                  <Field label="ФИО" error={touched && !nameOk ? "Нужны хотя бы фамилия и имя" : null}>
                    <Input autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} onBlur={() => setTouched(true)} placeholder="Фамилия Имя Отчество" autoComplete="off" />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Должность"><Input value={position} onChange={(e) => setPosition(e.target.value)} /></Field>
                    <Field label="Подрядчик"><Select value={contractor} onChange={setContractor} options={CONTRACTORS.map((c) => ({ value: c, label: c }))} /></Field>
                  </div>
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1.5 text-sm font-medium">Допуск в зоны</legend>
                    <div className="flex flex-wrap gap-2">
                      {db.zones.map((z) => {
                        const on = zoneIds.includes(z.id);
                        return (
                          <motion.button key={z.id} type="button" {...press} aria-pressed={on} onClick={() => setZoneIds((v) => (on ? v.filter((x) => x !== z.id) : [...v, z.id]))}
                            className={cn("flex h-control-sm items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors duration-fast", on ? "border-success-border bg-success-soft text-success-soft-foreground" : "border-border-strong text-muted-foreground hover:text-foreground")}>
                            <AnimatePresence initial={false}>{on && <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={spring.snappy} className="flex overflow-hidden"><Check className="size-4" /></motion.span>}</AnimatePresence>
                            {z.name}
                          </motion.button>
                        );
                      })}
                    </div>
                    {zoneIds.length === 0 && <p className="text-xs text-danger">Выберите хотя бы одну зону</p>}
                  </fieldset>
                </div>
              )}
              {step === 1 && <PhotoCapture value={photo} onChange={setPhoto} />}
              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <p className="text-sm text-muted-foreground">Смена на сегодня — без неё киоск не пустит.</p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-5">
                    <Field label="Начало"><Input type="time" value={shift.start} onChange={(e) => setShift((s) => ({ ...s, start: e.target.value }))} /></Field>
                    <Field label="Конец" error={shift.start >= shift.end ? "Позже начала" : null}><Input type="time" value={shift.end} onChange={(e) => setShift((s) => ({ ...s, end: e.target.value }))} /></Field>
                  </div>
                </div>
              )}
              {step === 3 && live && <InviteCard w={live} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2 border-t border-border px-4 py-3 sm:px-6 sm:py-4">
          {step > 0 && step < 3 && <Button variant="quiet" onClick={() => go(-1)}><ArrowLeft />Назад</Button>}
          {step === 0 && <Link to={routes.adminPeople} tabIndex={-1}><Button variant="quiet">Отмена</Button></Link>}
          <div className="ml-auto flex min-w-0">
            {step < 2 && <Button disabled={!canNext} onClick={() => { setTouched(true); go(1); }}>{step === 1 && !photo ? "Без фото" : "Дальше"}<ArrowRight /></Button>}
            {step === 2 && <Button disabled={!canNext || busy} onClick={finish}><span className="truncate">Создать и выдать QR</span><ArrowRight /></Button>}
            {step === 3 && live && <Button variant="secondary" onClick={() => nav(routes.adminPerson(live.id))}>Карточка сотрудника</Button>}
          </div>
        </div>
      </Card>
    </div>
  );
};
