import { RotateCcw } from "lucide-react";
import { api, useDb, type Settings } from "@/shared/api";
import { Button, Card, CardHeader, CardTitle, Field, Input, Switch, toast } from "@/shared/ui";
import { PageHeader } from "@/widgets/admin-shell";

export const SettingsPage = () => {
  const { settings: s } = useDb();
  const set = (patch: Partial<Settings>) => api.updateSettings(patch);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Настройки" sub="Пороги проверки и параметры песочницы" />
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader><CardTitle>Проверка прохода</CardTitle></CardHeader>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Порог сходства лица τ" hint="Проход, если сходство ≥ τ"><Input type="number" step="0.05" min="0.3" max="0.95" value={s.faceThreshold} onChange={(e) => set({ faceThreshold: Number(e.target.value) })} /></Field>
            <Field label="Допуск часов QR, с" hint="Насколько старым может быть код (окно — 30 с)"><Input type="number" step="15" min="30" max="180" value={s.qrToleranceSec} onChange={(e) => set({ qrToleranceSec: Number(e.target.value) })} /></Field>
            <Field label="Допуск к смене, мин" hint="Можно войти раньше начала смены на столько минут"><Input type="number" step="15" min="0" max="180" value={s.shiftGraceMin} onChange={(e) => set({ shiftGraceMin: Number(e.target.value) })} /></Field>
            <label className="flex items-center justify-between gap-4 rounded-md bg-muted p-4 text-sm"><span>Пускать только по смене</span><Switch checked={s.requireShift} onChange={(v) => set({ requireShift: v })} /></label>
          </div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Песочница</CardTitle></CardHeader>
          <div className="flex flex-col gap-4 p-5 text-sm">
            <p className="text-muted-foreground">Бэкенда нет: данные лежат в этом браузере (localStorage), вкладки синхронизируются между собой. Биометрии нет — живость оценивается по движению в кадре, совпадение лица задаётся переключателем «Чужое лицо» в демо-пульте киоска.</p>
            <label className="flex items-center justify-between gap-4 rounded-md bg-muted p-4"><span>Сверка лица вернёт «чужое лицо»</span><Switch checked={s.demoFace === "mismatch"} onChange={(v) => set({ demoFace: v ? "mismatch" : "match" })} /></label>
            <div><Button variant="destructive" onClick={() => { if (confirm("Сбросить все данные песочницы?")) { api.resetDemo(); toast.success("Демо-данные пересозданы"); } }}><RotateCcw />Сбросить демо-данные</Button></div>
          </div>
        </Card>
      </div>
    </div>
  );
};
