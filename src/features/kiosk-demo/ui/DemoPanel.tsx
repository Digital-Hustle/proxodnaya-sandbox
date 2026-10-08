import { useMemo, useState } from "react";
import { Smartphone, Repeat2, Clock3, FileWarning, UserX, ImageOff, Hand } from "lucide-react";
import { api, useDb, presenceNow, shiftFor } from "@/shared/api";
import { Avatar, Badge, Button, Dialog, Switch, Select, Input, Field, toast } from "@/shared/ui";
import { useKioskDemo } from "../model/demoStore";

type Props = { open: boolean; onClose: () => void; onScan: (raw: string) => void; onManual: (workerId: string, note: string) => void };

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
    <Dialog open={open} onClose={onClose} title="Демо-пульт киоска" className="sm:max-w-2xl">
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Smartphone className="size-4" />Виртуальный телефон — показать QR сотрудника</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {people.map((w) => {
              const sh = shiftFor(db, w.id);
              return (
                <button key={w.id} onClick={() => go(() => api.virtualPassQr(w.id))} className="flex items-center gap-3 rounded-md border border-border/60 bg-card p-3 text-left transition-colors duration-fast hover:border-ring">
                  <Avatar name={w.fullName} photo={w.photo} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{w.fullName}</div>
                    <div className="text-xs text-muted-foreground">{sh ? `смена ${sh.start}–${sh.end}` : "нет смены"}</div>
                  </div>
                  {inside.has(w.id) && <Badge tone="success">внутри</Badge>}
                </button>
              );
            })}
          </div>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Попытки обмана</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="outline" disabled={!lastQr} onClick={() => lastQr && go(async () => lastQr)}><Repeat2 />Повтор QR</Button>
            <Button variant="outline" onClick={() => go(() => api.virtualPassQr(target, -6))}><Clock3 />Старый скриншот</Button>
            <Button variant="outline" onClick={() => go(() => api.forgePassQr(target))}><FileWarning />Подделка</Button>
          </div>
          <div className="mt-3 flex flex-col gap-3 rounded-md bg-muted p-4">
            <label className="flex items-center justify-between gap-4 text-sm"><span className="flex items-center gap-2"><UserX className="size-4" />Чужое лицо перед камерой (сверка не совпадёт)</span>
              <Switch checked={db.settings.demoFace === "mismatch"} onChange={(v) => api.updateSettings({ demoFace: v ? "mismatch" : "match" })} /></label>
            <label className="flex items-center justify-between gap-4 text-sm"><span className="flex items-center gap-2"><ImageOff className="size-4" />Фото вместо человека (нет движения)</span>
              <Switch checked={photoAttack} onChange={setPhotoAttack} /></label>
          </div>
        </section>
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Hand className="size-4" />Ручной проход охранником</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field label="Сотрудник" className="flex-1"><Select value={manualWorker} onChange={(e) => setManualWorker(e.target.value)}>{db.workers.map((w) => <option key={w.id} value={w.id}>{w.fullName}</option>)}</Select></Field>
            <Field label="Причина" className="flex-1"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Сел телефон" /></Field>
            <Button variant="secondary" disabled={!note.trim()} onClick={() => { onClose(); onManual(manualWorker, note.trim()); setNote(""); toast.info("Ручной проход записан в журнал"); }}>Пропустить</Button>
          </div>
        </section>
      </div>
    </Dialog>
  );
};
