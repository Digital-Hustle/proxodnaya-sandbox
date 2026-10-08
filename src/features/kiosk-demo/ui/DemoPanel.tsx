import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Repeat2, Clock3, FileWarning, UserX, ImageOff } from "lucide-react";
import { api, useDb, presenceNow, shiftFor } from "@/shared/api";
import { Avatar, Status, Button, Dialog, SwitchRow, Select, Input, Field, toast } from "@/shared/ui";
import { press } from "@/shared/config/motion";
import { useKioskDemo } from "../model/demoStore";

type Props = { open: boolean; onClose: () => void; onScan: (raw: string) => void; onManual: (workerId: string, note: string) => void };

const Section = ({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3">
    <div><h3 className="text-sm font-medium">{title}</h3>{text && <p className="text-xs text-muted-foreground">{text}</p>}</div>
    {children}
  </section>
);

/** Пульт для проверки без второго телефона: «виртуальный телефон» сотрудника и типовые атаки. */
export const DemoPanel = ({ open, onClose, onScan, onManual }: Props) => {
  const db = useDb();
  const { photoAttack, setPhotoAttack, lastQr } = useKioskDemo();
  const inside = useMemo(() => new Set(presenceNow(db).map((p) => p.workerId)), [db]);
  const people = db.workers.filter((w) => w.status === "active").slice(0, 8);
  const [manualWorker, setManualWorker] = useState(people[0]?.id ?? "");
  const [note, setNote] = useState("");
  const go = async (fn: () => Promise<string>) => { onClose(); onScan(await fn()); };
  const target = people[0]?.id ?? "w_01";

  return (
    <Dialog open={open} onClose={onClose} title="Демо-пульт" description="Проверка без второго телефона: покажите QR сотрудника или попробуйте обмануть киоск" className="sm:max-w-2xl">
      <div className="flex flex-col gap-7">
        <Section title="Виртуальный телефон" text="Нажмите на сотрудника — киоск получит его настоящий подписанный QR">
          <div className="grid gap-2 sm:grid-cols-2">
            {people.map((w) => {
              const sh = shiftFor(db, w.id);
              return (
                <motion.button key={w.id} type="button" {...press} onClick={() => go(() => api.virtualPassQr(w.id))}
                  className="flex min-h-control-lg min-w-0 items-center gap-3 rounded-md border border-border bg-card p-2.5 text-left transition-colors duration-fast hover:border-border-strong hover:bg-muted">
                  <Avatar name={w.fullName} photo={w.photo} className="size-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{w.fullName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{sh ? `смена ${sh.start}–${sh.end}` : "нет смены"}</span>
                  </span>
                  {inside.has(w.id) && <Status tone="success" dot>внутри</Status>}
                </motion.button>
              );
            })}
          </div>
        </Section>
        <Section title="Попытки обмана" text="Каждая должна закончиться отказом с понятной причиной">
          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="secondary" disabled={!lastQr} onClick={() => lastQr && go(async () => lastQr)}><Repeat2 />Повтор QR</Button>
            <Button variant="secondary" onClick={() => go(() => api.virtualPassQr(target, -6))}><Clock3 />Старый скриншот</Button>
            <Button variant="secondary" onClick={() => go(() => api.forgePassQr(target))}><FileWarning />Подделка</Button>
          </div>
          <div className="flex flex-col divide-y divide-border rounded-md border border-border px-3">
            <SwitchRow icon={<UserX />} title="Чужое лицо перед камерой" text="Сверка лица не совпадёт" checked={db.settings.demoFace === "mismatch"} onChange={(v) => api.updateSettings({ demoFace: v ? "mismatch" : "match" })} />
            <SwitchRow icon={<ImageOff />} title="Фото вместо человека" text="В кадре нет движения" checked={photoAttack} onChange={setPhotoAttack} />
          </div>
        </Section>
        <Section title="Ручной проход охранником" text="Запишется в журнал с причиной">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Сотрудник"><Select value={manualWorker} onChange={setManualWorker} options={db.workers.map((w) => ({ value: w.id, label: w.fullName }))} /></Field>
            <Field label="Причина"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Сел телефон" /></Field>
          </div>
          <Button variant="outline" disabled={!note.trim()} className="self-start" onClick={() => { onClose(); onManual(manualWorker, note.trim()); setNote(""); toast.info("Ручной проход записан в журнал"); }}>Пропустить вручную</Button>
        </Section>
      </div>
    </Dialog>
  );
};
