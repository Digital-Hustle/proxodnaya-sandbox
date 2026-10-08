import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Link2, MonitorSmartphone, Pencil, Unlink, BookOpen, ScanLine } from "lucide-react";
import { api, useDb, KIOSK_ONLINE_MS, type Kiosk, type TerminalMode } from "@/shared/api";
import { Button, Card, CardHeader, CardTitle, Dialog, EmptyState, Field, Input, PageHeader, Select, Status, toast } from "@/shared/ui";
import { useNow } from "@/shared/hooks";
import { agoRu } from "@/shared/lib";
import { routes } from "@/shared/const/router";
import { fadeUp, stagger } from "@/shared/config/motion";
import { MODE_LABEL } from "@/widgets/kiosk-terminal";

type ModeOpt = TerminalMode | "DEFAULT";
export const ADR_URL = "https://github.com/Digital-Hustle/proxodnaya-sandbox/blob/main/docs/ADR-038-terminal-modes.md";

const useModeOptions = () => {
  const { settings } = useDb();
  const def = settings.terminalMode ?? "QR_FACE";
  return [
    { value: "DEFAULT" as ModeOpt, label: "Как в настройках", hint: MODE_LABEL[def] },
    { value: "QR_FACE" as ModeOpt, label: MODE_LABEL.QR_FACE, hint: "рекомендуется" },
    { value: "FACE_FIRST" as ModeOpt, label: MODE_LABEL.FACE_FIRST },
  ];
};

const EditDialog = ({ kiosk, onClose }: { kiosk: Kiosk; onClose: () => void }) => {
  const db = useDb();
  const modes = useModeOptions();
  const [name, setName] = useState(kiosk.name ?? "");
  const [cp, setCp] = useState(kiosk.checkpointId ?? db.checkpoints[0].id);
  const [mode, setMode] = useState<ModeOpt>(kiosk.mode ?? "DEFAULT");
  const save = async () => { await api.updateKiosk(kiosk.id, { name: name.trim() || "Терминал", checkpointId: cp, mode: mode === "DEFAULT" ? undefined : mode }); toast.success("Терминал обновлён"); onClose(); };
  return (
    <Dialog open onClose={onClose} title="Настройка терминала" description="Изменения применяются на киоске сразу"
      footer={<><Button variant="quiet" onClick={onClose}>Отмена</Button><Button onClick={save}>Сохранить</Button></>}>
      <div className="flex flex-col gap-5">
        <Field label="Название"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Проходная"><Select value={cp} onChange={setCp} options={db.checkpoints.map((c) => ({ value: c.id, label: c.name }))} /></Field>
        <Field label="Логика работы"><Select value={mode} onChange={setMode} options={modes} /></Field>
      </div>
    </Dialog>
  );
};

/** Терминалы: привязка киоска по коду с его экрана, выбор проходной и логики работы (ADR-038). */
export const TerminalsPage = () => {
  const db = useDb();
  const now = useNow(5000);
  const modes = useModeOptions();
  const [sp, setSp] = useSearchParams();
  const [code, setCode] = useState((sp.get("code") ?? "").toUpperCase());
  const [name, setName] = useState("");
  const [cp, setCp] = useState(db.checkpoints[0]?.id ?? "");
  const [mode, setMode] = useState<ModeOpt>("DEFAULT");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<Kiosk | null>(null);
  const kiosks = db.kiosks ?? [];
  const paired = kiosks.filter((k) => k.pairedAt).sort((a, b) => (b.pairedAt ?? 0) - (a.pairedAt ?? 0));
  const waiting = kiosks.filter((k) => !k.pairedAt && now - k.lastSeen < KIOSK_ONLINE_MS * 2);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      await api.pairKiosk(code, { name, checkpointId: cp, mode: mode === "DEFAULT" ? undefined : mode });
      toast.success("Терминал подключён — можно проходить");
      setCode(""); setName("");
      if (sp.has("code")) { sp.delete("code"); setSp(sp, { replace: true }); }
    } catch (x) { setErr(x instanceof Error ? x.message : "Не удалось привязать"); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Терминалы" sub="Киоски у турникетов: привязка к проходной и логика работы"
        actions={<Link to={routes.kiosk} target="_blank" tabIndex={-1}><Button variant="secondary"><ScanLine />Открыть новый киоск</Button></Link>} />
      <motion.div variants={stagger()} initial="hidden" animate="show" className="flex flex-col gap-3 sm:gap-4">
        <motion.div variants={fadeUp}><Card>
          <CardHeader><CardTitle>Подключить терминал</CardTitle></CardHeader>
          <form onSubmit={submit} className="flex flex-col gap-5 p-4 sm:p-6">
            <p className="text-pretty text-sm text-muted-foreground">Новый киоск показывает 6-значный код и QR. Отсканируйте QR телефоном или введите код. Пока киоск не привязан, он никого не пропускает, а проходную и логику нельзя поменять с самого киоска.</p>
            {waiting.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">Ждут привязки:</span>
                {waiting.map((k) => <Button key={k.id} type="button" size="sm" variant={code === k.pairCode ? "primary" : "outline"} className="font-mono" onClick={() => setCode(k.pairCode)}>{k.pairCode}</Button>)}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Код с экрана киоска" error={err}><Input value={code} maxLength={6} onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setErr(null); }} placeholder="Например, K7Q2MX" className="font-mono tracking-widest" autoComplete="off" /></Field>
              <Field label="Название"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Турникет 1" /></Field>
              <Field label="Проходная"><Select value={cp} onChange={setCp} options={db.checkpoints.map((c) => ({ value: c.id, label: c.name }))} /></Field>
              <Field label="Логика работы" hint="По умолчанию — как в настройках"><Select value={mode} onChange={setMode} options={modes} /></Field>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={code.length !== 6 || !cp || busy}><Link2 />Привязать</Button>
              <a href={ADR_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"><BookOpen className="size-4" />Как выбрать логику работы</a>
            </div>
          </form>
        </Card></motion.div>

        <motion.div variants={fadeUp}><Card>
          <CardHeader><CardTitle>Подключённые терминалы</CardTitle></CardHeader>
          {paired.length === 0 ? <EmptyState icon={<MonitorSmartphone />} title="Пока ни одного" text="Откройте киоск на планшете у турникета и введите код с его экрана" /> : (
            <ul className="divide-y divide-border">
              {paired.map((k) => {
                const online = now - k.lastSeen < KIOSK_ONLINE_MS;
                return (
                  <li key={k.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface text-muted-foreground"><MonitorSmartphone className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{k.name}</div>
                      <div className="truncate text-sm text-muted-foreground">{db.checkpoints.find((c) => c.id === k.checkpointId)?.name ?? "—"} · {k.mode ? MODE_LABEL[k.mode] : `${MODE_LABEL[db.settings.terminalMode ?? "QR_FACE"]} (по умолчанию)`}</div>
                    </div>
                    {online ? <Status tone="success" dot>на связи</Status> : <Status tone="neutral" dot>{`был ${agoRu(k.lastSeen)}`}</Status>}
                    <div className="flex gap-1">
                      <Button size="icon-sm" variant="quiet" aria-label="Настроить" onClick={() => setEdit(k)}><Pencil /></Button>
                      <Button size="icon-sm" variant="quiet" aria-label="Отвязать" onClick={() => api.unpairKiosk(k.id).then(() => toast.info("Терминал отвязан и больше не пропускает"))}><Unlink /></Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card></motion.div>
      </motion.div>
      {edit && <EditDialog kiosk={edit} onClose={() => setEdit(null)} />}
    </div>
  );
};
