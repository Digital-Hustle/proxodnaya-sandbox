import { useState } from "react";
import { Link } from "react-router";
import { FlaskConical, Unlink, ExternalLink, WifiOff } from "lucide-react";
import { api, useDb, terminalModeOf, type Kiosk } from "@/shared/api";
import { Button, Dialog, Field, Input, SwitchRow, Status, toast } from "@/shared/ui";
import { routes } from "@/shared/const/router";
import { agoRu } from "@/shared/lib";

export const SERVICE_PIN = "2580";
export const MODE_LABEL = { QR_FACE: "QR + лицо", FACE_FIRST: "Сначала лицо, QR — запасной" } as const;

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="text-muted-foreground">{k}</span><span className="min-w-0 truncate text-right font-medium">{v}</span></div>
);

/** Сервисная панель терминала для инженера: состояние, имитация обрыва связи, сброс привязки. Защищена кодом. */
export const ServicePanel = ({ open, onClose, kioskId, kiosk, simOffline, setSimOffline, onDemo }: {
  open: boolean; onClose: () => void; kioskId: string; kiosk?: Kiosk; simOffline: boolean; setSimOffline: (v: boolean) => void; onDemo: () => void;
}) => {
  const db = useDb();
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(false);
  const close = () => { onClose(); setPin(""); };
  const cp = db.checkpoints.find((c) => c.id === kiosk?.checkpointId);
  return (
    <Dialog open={open} onClose={close} title="Сервисная панель" description={ok ? "Для инженера терминалов" : "Введите сервисный код"}>
      {!ok ? (
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (pin === SERVICE_PIN) setOk(true); else toast.error("Неверный код"); }}>
          <Field label="Сервисный код" hint="Демо: 2580"><Input type="password" inputMode="numeric" maxLength={4} autoFocus value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" /></Field>
          <Button type="submit" disabled={pin.length < 4}>Открыть</Button>
        </form>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col divide-y divide-border rounded-md border border-border px-3">
            <Row k="Идентификатор" v={<span className="font-mono text-xs">{kioskId}</span>} />
            <Row k="Статус" v={kiosk?.pairedAt ? <Status tone="success" dot>привязан</Status> : <Status tone="warning" dot>ждёт привязки · {kiosk?.pairCode}</Status>} />
            {kiosk?.pairedAt && <Row k="Название" v={kiosk.name} />}
            {kiosk?.pairedAt && <Row k="Проходная" v={cp?.name ?? "—"} />}
            <Row k="Логика работы" v={MODE_LABEL[terminalModeOf(db, kiosk)]} />
            <Row k="Без связи" v={(db.settings.offlinePolicy ?? "GUARD") === "GUARD" ? "пропуск охранником" : "проход закрыт"} />
            {kiosk?.pairedAt && <Row k="Привязан" v={agoRu(kiosk.pairedAt)} />}
          </div>
          <p className="text-xs text-muted-foreground">Проходная и логика работы меняются только в админке: на самом терминале их нельзя подменить.</p>
          <div className="rounded-md border border-border px-3"><SwitchRow icon={<WifiOff />} title="Имитировать обрыв связи" text="Проверка поведения без сети" checked={simOffline} onChange={setSimOffline} /></div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="secondary" disabled={!kiosk?.pairedAt} onClick={() => { close(); onDemo(); }}><FlaskConical />Демо-пульт</Button>
            <Link to={routes.adminTerminals} target="_blank" tabIndex={-1} className="contents"><Button variant="secondary"><ExternalLink />В админке</Button></Link>
            <Button variant="danger-soft" disabled={!kiosk?.pairedAt} onClick={() => api.unpairKiosk(kioskId).then(() => { close(); toast.info("Терминал отвязан"); })}><Unlink />Отвязать</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
};
