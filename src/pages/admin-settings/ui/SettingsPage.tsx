import { useState } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { api, useDb, type Settings } from "@/shared/api";
import { Button, Card, CardHeader, CardTitle, Dialog, Field, Input, SwitchRow, toast, PageHeader } from "@/shared/ui";
import { fadeUp, stagger } from "@/shared/config/motion";

export const SettingsPage = () => {
  const { settings: s } = useDb();
  const [reset, setReset] = useState(false);
  const set = (patch: Partial<Settings>) => api.updateSettings(patch);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Настройки" sub="Пороги проверки и параметры песочницы" />
      <motion.div variants={stagger()} initial="hidden" animate="show" className="flex flex-col gap-3 sm:gap-4">
        <motion.div variants={fadeUp}><Card>
          <CardHeader><CardTitle>Проверка прохода</CardTitle></CardHeader>
          <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
            <Field label="Порог сходства лица τ" hint="Проход, если сходство ≥ τ"><Input type="number" inputMode="decimal" step="0.05" min="0.3" max="0.95" value={s.faceThreshold} onChange={(e) => set({ faceThreshold: Number(e.target.value) })} /></Field>
            <Field label="Допуск часов QR, с" hint="Насколько старым может быть код (окно — 30 с)"><Input type="number" inputMode="numeric" step="15" min="30" max="180" value={s.qrToleranceSec} onChange={(e) => set({ qrToleranceSec: Number(e.target.value) })} /></Field>
            <Field label="Допуск к смене, мин" hint="Можно войти раньше начала смены на столько минут"><Input type="number" inputMode="numeric" step="15" min="0" max="180" value={s.shiftGraceMin} onChange={(e) => set({ shiftGraceMin: Number(e.target.value) })} /></Field>
            <div className="self-end rounded-md border border-border px-3"><SwitchRow title="Пускать только по смене" text="Без смены — отказ" checked={s.requireShift} onChange={(v) => set({ requireShift: v })} /></div>
          </div>
        </Card></motion.div>
        <motion.div variants={fadeUp}><Card>
          <CardHeader><CardTitle>Песочница</CardTitle></CardHeader>
          <div className="flex flex-col gap-4 p-4 sm:p-6">
            <p className="text-pretty text-sm text-muted-foreground">Бэкенда нет: данные лежат в этом браузере, вкладки синхронизируются между собой. Биометрии нет — живость оценивается по движению в кадре, совпадение лица задаётся переключателем ниже или в демо-пульте киоска.</p>
            <div className="rounded-md border border-border px-3"><SwitchRow title="Сверка лица вернёт «чужое лицо»" text="Для проверки отказа FACE_MISMATCH" checked={s.demoFace === "mismatch"} onChange={(v) => set({ demoFace: v ? "mismatch" : "match" })} /></div>
            <div><Button variant="danger-soft" onClick={() => setReset(true)}><RotateCcw />Сбросить демо-данные</Button></div>
          </div>
        </Card></motion.div>
      </motion.div>
      <Dialog open={reset} onClose={() => setReset(false)} title="Сбросить демо-данные?" description="Сотрудники, смены и журнал пересоздадутся заново. Привязанные телефоны придётся привязать снова."
        footer={<><Button variant="quiet" onClick={() => setReset(false)}>Отмена</Button><Button variant="danger" onClick={() => { api.resetDemo(); setReset(false); toast.success("Демо-данные пересозданы"); }}>Сбросить</Button></>}>
        <span />
      </Dialog>
    </div>
  );
};
