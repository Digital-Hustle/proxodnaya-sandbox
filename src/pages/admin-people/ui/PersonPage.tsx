import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Ban, CheckCircle2, QrCode, Smartphone, Trash2 } from "lucide-react";
import { api, useDb, presenceNow, workedMs, buildIntervals, shiftFor } from "@/shared/api";
import { Avatar, Badge, Button, Card, CardHeader, CardTitle, Dialog, EmptyState, Field, Input, toast } from "@/shared/ui";
import { AttemptRow } from "@/entities/pass";
import { WorkerStatusBadge } from "@/entities/worker";
import { dateRu, durationRu, todayKey } from "@/shared/lib";
import { routes } from "@/shared/const/router";
import { InviteCard } from "./InviteCard";

export const PersonPage = () => {
  const { id = "" } = useParams();
  const db = useDb();
  const [invite, setInvite] = useState(false);
  const w = db.workers.find((x) => x.id === id);
  const inside = useMemo(() => presenceNow(db).some((p) => p.workerId === id), [db, id]);
  const worked = useMemo(() => workedMs(db, id, todayKey(), buildIntervals(db)), [db, id]);
  if (!w) return <EmptyState title="Сотрудник не найден" action={<Link to={routes.adminPeople}><Button variant="outline">К списку</Button></Link>} />;
  const devices = db.devices.filter((d) => d.workerId === w.id).sort((a, b) => b.createdAt - a.createdAt);
  const history = db.attempts.filter((a) => a.workerId === w.id).slice(-20).reverse();
  const sh = shiftFor(db, w.id);

  return (
    <div>
      <Link to={routes.adminPeople} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Люди</Link>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={w.fullName} photo={w.photo} className="size-20 text-2xl" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{w.fullName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{w.position} · {w.contractor}<WorkerStatusBadge w={w} inside={inside} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={async () => { if (!w.inviteCode) await api.regenerateInvite(w.id); setInvite(true); }}><QrCode />Инвайт</Button>
          {w.status === "active"
            ? <Button variant="destructive" onClick={() => api.updateWorker(w.id, { status: "blocked" }).then(() => toast.info("Доступ заблокирован"))}><Ban />Заблокировать</Button>
            : <Button onClick={() => api.updateWorker(w.id, { status: "active" }).then(() => toast.success("Доступ восстановлен"))}><CheckCircle2 />Разблокировать</Button>}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Проходы</CardTitle><span className="text-sm text-muted-foreground">сегодня отработано {durationRu(worked)}</span></CardHeader>
          <div className="divide-y divide-border/60 px-5 pb-2">{history.length ? history.map((a) => <AttemptRow key={a.id} a={a} showDate />) : <EmptyState title="Проходов не было" />}</div>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Допуск</CardTitle></CardHeader>
            <div className="flex flex-col gap-4 p-5">
              <div className="flex flex-wrap gap-2">{w.zoneIds.map((z) => <Badge key={z} tone="success">{db.zones.find((x) => x.id === z)?.name}</Badge>)}</div>
              <Field label="Инструктаж и медосмотр до"><Input type="date" value={w.permitUntil} onChange={(e) => api.updateWorker(w.id, { permitUntil: e.target.value })} /></Field>
              <div className="text-sm text-muted-foreground">Смена сегодня: <b className="text-foreground">{sh ? `${sh.start}–${sh.end}` : "нет"}</b></div>
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Устройства</CardTitle></CardHeader>
            <div className="flex flex-col gap-2 p-5">
              {devices.length === 0 && <div className="text-sm text-muted-foreground">Телефон ещё не привязан</div>}
              {devices.map((d) => (
                <div key={d.id} className="flex items-center gap-3 text-sm">
                  <Smartphone className="size-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1"><div className="truncate font-medium">{d.label}</div><div className="text-xs text-muted-foreground">{dateRu(d.createdAt)} · {d.id}</div></div>
                  {d.revokedAt ? <Badge>отвязан</Badge> : <Button variant="ghost" size="icon" aria-label="Отвязать" onClick={() => api.revokeDevice(d.id).then(() => toast.info("Телефон отвязан — его QR больше не пройдёт"))}><Trash2 /></Button>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Dialog open={invite} onClose={() => setInvite(false)} title="Приглашение"><InviteCard w={w} /></Dialog>
    </div>
  );
};
