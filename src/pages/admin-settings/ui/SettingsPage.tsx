import { useState } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { api, useDb, type Settings, type CheckpointMode } from "@/shared/api";
import { Button, Card, CardHeader, CardTitle, Dialog, Field, Input, SwitchRow, toast, PageHeader, Select } from "@/shared/ui";
import { fadeUp, stagger } from "@/shared/config/motion";

export const SettingsPage = () => {
  const { settings: s, checkpoints } = useDb();
  const [reset, setReset] = useState(false);
  const set = (patch: Partial<Settings>) => api.updateSettings(patch);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Настройки" sub="Параметры проверки прохода и демо-режима" />
      <motion.div variants={stagger()} initial="hidden" animate="show" className="flex flex-col gap-3 sm:gap-4">
        <motion.div variants={fadeUp}><Card>
          <CardHeader><CardTitle>Проверка прохода</CardTitle></CardHeader>
          <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
            <Field label="Порог сходства лица τ" hint="Проход разрешается при сходстве ≥ τ"><Input type="number" inputMode="decimal" step="0.05" min="0.3" max="0.95" value={s.faceThreshold} onChange={(e) => set({ faceThreshold: Number(e.target.value) })} /></Field>
            <Field label="Допуск часов QR, с" hint="Допустимое расхождение часов устройства и киоска (окно кода — 30 с)"><Input type="number" inputMode="numeric" step="15" min="30" max="180" value={s.qrToleranceSec} onChange={(e) => set({ qrToleranceSec: Number(e.target.value) })} /></Field>
            <Field label="Допуск к смене, мин" hint="За сколько минут до начала смены разрешён вход"><Input type="number" inputMode="numeric" step="15" min="0" max="180" value={s.shiftGraceMin} onChange={(e) => set({ shiftGraceMin: Number(e.target.value) })} /></Field>
            <div className="self-end rounded-md border border-border px-3"><SwitchRow title="Пускать только по смене" text="Сотрудник без смены на сегодня не допускается" checked={s.requireShift} onChange={(v) => set({ requireShift: v })} /></div>
          </div>
        </Card></motion.div>
        <motion.div variants={fadeUp}><Card>
          <CardHeader><CardTitle>Определение направления</CardTitle></CardHeader>
          <div className="flex flex-col gap-5 p-4 sm:p-6">
            <p className="text-pretty text-sm text-muted-foreground">Киоск не спрашивает, вход это или выход: направление определяет система по текущему присутствию сотрудника (ADR-037). Для турникетов, работающих только на вход или только на выход, задайте фиксированный режим.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Защита от повторного скана, с" hint="Повторное предъявление в этот период отклоняется с кодом REPEAT_SCAN"><Input type="number" inputMode="numeric" step="5" min="5" max="300" value={s.repeatScanCooldownSec ?? 30} onChange={(e) => set({ repeatScanCooldownSec: Number(e.target.value) })} /></Field>
              <Field label="Незакрытое присутствие, ч" hint="Если выход не отмечен дольше этого срока, следующий скан считается входом"><Input type="number" inputMode="numeric" step="1" min="4" max="48" value={s.presenceTtlHours ?? 16} onChange={(e) => set({ presenceTtlHours: Number(e.target.value) })} /></Field>
            </div>
            <div className="flex flex-col divide-y divide-border rounded-md border border-border">
              {checkpoints.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                  <span className="text-sm font-medium">{c.name}</span>
                  <Select size="sm" value={c.mode ?? "AUTO"} onChange={(v) => api.updateCheckpoint(c.id, { mode: v as CheckpointMode })} aria-label={`Режим: ${c.name}`} className="w-auto"
                    options={[{ value: "AUTO", label: "Автоматически" }, { value: "IN", label: "Только вход" }, { value: "OUT", label: "Только выход" }]} />
                </div>
              ))}
            </div>
          </div>
        </Card></motion.div>
        <motion.div variants={fadeUp}><Card>
          <CardHeader><CardTitle>Демо-режим</CardTitle></CardHeader>
          <div className="flex flex-col gap-4 p-4 sm:p-6">
            <p className="text-pretty text-sm text-muted-foreground">Стенд работает без сервера: данные хранятся в браузере и синхронизируются между вкладками. Биометрия не используется — живое присутствие оценивается по движению в кадре, результат сверки лица задаётся переключателем ниже.</p>
            <div className="rounded-md border border-border px-3"><SwitchRow title="Имитировать несовпадение лица" text="Сверка лица завершится отказом FACE_MISMATCH" checked={s.demoFace === "mismatch"} onChange={(v) => set({ demoFace: v ? "mismatch" : "match" })} /></div>
            <div><Button variant="danger-soft" onClick={() => setReset(true)}><RotateCcw />Сбросить демо-данные</Button></div>
          </div>
        </Card></motion.div>
      </motion.div>
      <Dialog open={reset} onClose={() => setReset(false)} title="Сбросить демо-данные?" description="Сотрудники, смены и журнал будут созданы заново. Активированные пропуска потребуется активировать повторно."
        footer={<><Button variant="quiet" onClick={() => setReset(false)}>Отмена</Button><Button variant="danger" onClick={() => { api.resetDemo(); setReset(false); toast.success("Демо-данные пересозданы"); }}>Сбросить</Button></>}>
        <span />
      </Dialog>
    </div>
  );
};
