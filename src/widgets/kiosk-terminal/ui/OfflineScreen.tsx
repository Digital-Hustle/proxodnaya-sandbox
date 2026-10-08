import { useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, WifiOff } from "lucide-react";
import { api, useDb, type DecisionResult, type OfflinePolicy } from "@/shared/api";
import { Aurora, Button, Dialog, Field, Input, Select, toast } from "@/shared/ui";
import { fadeUp, popIn, stagger, duration, ease } from "@/shared/config/motion";

export const GUARD_PIN = "0000";
const pulse = { duration: duration.loop, repeat: Infinity, ease: ease.inOut } as const;

/**
 * Нет связи с сервером (ADR-038, FR-70). Автоматического пропуска нет: решение принимает сервер (Д2),
 * а без него — только охранник, с причиной, отметкой MANUAL и отправкой в журнал после восстановления связи.
 */
export const OfflineScreen = ({ policy, checkpointId, onResult }: { policy: OfflinePolicy; checkpointId: string; onResult: (r: DecisionResult) => void }) => {
  const db = useDb();
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState(db.workers[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const pinBad = pin.length === 4 && pin !== GUARD_PIN;
  const submit = async () => {
    const r = await api.kioskManual(who, checkpointId, `Без связи: ${note.trim()}`);
    setOpen(false); setNote(""); setPin("");
    toast.info("Ручной пропуск сохранён и уйдёт в журнал при появлении связи");
    onResult(r);
  };
  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-white/10">
      <div aria-hidden className="absolute inset-0 opacity-50"><Aurora tone="kiosk" intensity={0.4} /></div>
      <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="relative flex flex-1 flex-col items-center justify-center gap-6 p-5 text-center text-white sm:p-8">
        <motion.span variants={popIn} className="relative flex size-20 items-center justify-center rounded-full bg-warning/20 text-warning">
          <motion.span aria-hidden className="absolute inset-0 rounded-full bg-warning/20" animate={{ scale: [1, 1.35], opacity: [0.6, 0] }} transition={pulse} />
          <WifiOff className="size-9" />
        </motion.span>
        <motion.div variants={fadeUp} className="flex max-w-xl flex-col gap-2">
          <h1 className="text-balance font-display text-3xl font-semibold tracking-display sm:text-4xl">Нет связи с сервером</h1>
          <p className="text-balance text-base text-white/70 sm:text-lg">{policy === "GUARD" ? "Автоматический проход временно недоступен. Обратитесь к охраннику — он пропустит вручную" : "Проход закрыт до восстановления связи. Обратитесь к охране"}</p>
        </motion.div>
        {policy === "GUARD" && <motion.div variants={fadeUp}><Button size="lg" variant="secondary" onClick={() => setOpen(true)}><ShieldCheck />Пропуск охранником</Button></motion.div>}
      </motion.div>
      <Dialog open={open} onClose={() => setOpen(false)} title="Пропуск охранником" description="Запись помечается как ручная, хранится на терминале и уходит в журнал, когда связь вернётся"
        footer={<Button disabled={!who || !note.trim() || pin !== GUARD_PIN} onClick={submit}><ShieldCheck />Пропустить</Button>}>
        <div className="flex flex-col gap-5">
          <Field label="Сотрудник" hint="Сверьте лицо с фото из снимка допусков"><Select value={who} onChange={setWho} options={db.workers.filter((w) => w.status === "active").map((w) => ({ value: w.id, label: w.fullName, hint: w.position }))} /></Field>
          <Field label="Причина"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Например: нет связи, личность подтверждена по паспорту" /></Field>
          <Field label="PIN охранника" hint="Демо: 0000" error={pinBad ? "Неверный PIN" : null}><Input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" /></Field>
        </div>
      </Dialog>
    </div>
  );
};
