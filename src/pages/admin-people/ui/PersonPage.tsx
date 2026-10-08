import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Ban, CheckCircle2, QrCode, Smartphone, Trash2 } from "lucide-react";
import { api, useDb, presenceNow, workedMs, buildIntervals, shiftFor } from "@/shared/api";
import { Avatar, Status, Button, Card, CardHeader, CardTitle, Dialog, EmptyState, Field, toast } from "@/shared/ui";
import { DatePicker } from "@/shared/ui";
import { AttemptRow, directionSource } from "@/entities/pass";
import { WorkerStatusBadge } from "@/entities/worker";
import { dateRu, durationRu, todayKey } from "@/shared/lib";
import { routes } from "@/shared/const/router";
import { fadeUp, stagger } from "@/shared/config/motion";
import { InviteCard } from "./InviteCard";

export const PersonPage = () => {
  const { id = "" } = useParams();
  const db = useDb();
  const [invite, setInvite] = useState(false);
  const w = db.workers.find((x) => x.id === id);
  const inside = useMemo(() => presenceNow(db).some((p) => p.workerId === id), [db, id]);
  const worked = useMemo(() => workedMs(db, id, todayKey(), buildIntervals(db)), [db, id]);
  if (!w) return <Card><EmptyState title="Сотрудник не найден" action={<Link to={routes.adminPeople}><Button variant="outline">К списку</Button></Link>} /></Card>;
  const devices = db.devices.filter((d) => d.workerId === w.id).sort((a, b) => b.createdAt - a.createdAt);
  const history = db.attempts.filter((a) => a.workerId === w.id).slice(-20).reverse();
  const sh = shiftFor(db, w.id);

  return (
    <motion.div variants={stagger()} initial="hidden" animate="show">
      <motion.div variants={fadeUp}><Link to={routes.adminPeople} className="-ml-2 mb-4 inline-flex min-h-control-sm items-center gap-1.5 rounded-sm px-2 text-sm font-medium text-muted-foreground transition-colors duration-fast hover:bg-surface hover:text-foreground"><ArrowLeft className="size-4" />Люди</Link></motion.div>
      <motion.div variants={fadeUp} className="mb-5 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar name={w.fullName} photo={w.photo} className="size-16 text-xl sm:size-20 sm:text-2xl" />
          <div className="min-w-0">
            <h1 className="text-balance font-display text-2xl font-semibold tracking-display sm:text-3xl">{w.fullName}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground"><span>{w.position} · {w.contractor}</span><WorkerStatusBadge w={w} inside={inside} /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="secondary" onClick={async () => { if (!w.inviteCode) await api.regenerateInvite(w.id); setInvite(true); }}><QrCode />Приглашение</Button>
          {w.status === "active"
            ? <Button variant="danger-soft" onClick={() => api.updateWorker(w.id, { status: "blocked" }).then(() => toast.info("Доступ заблокирован"))}><Ban />Заблокировать</Button>
            : <Button onClick={() => api.updateWorker(w.id, { status: "active" }).then(() => toast.success("Доступ восстановлен"))}><CheckCircle2 />Разблокировать</Button>}
        </div>
      </motion.div>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <motion.div variants={fadeUp} className="min-w-0 lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex-wrap"><CardTitle>Проходы</CardTitle><span className="text-sm text-muted-foreground">сегодня отработано <span className="font-medium tabular-nums text-foreground">{durationRu(worked)}</span></span></CardHeader>
            <div className="px-4 pb-2 pt-2 sm:px-6">{history.length ? <div className="divide-y divide-border">{history.map((a) => <AttemptRow key={a.id} a={a} showDate dirSource={directionSource(db.checkpoints.find((c) => c.id === a.checkpointId))} />)}</div> : <EmptyState title="Проходов не было" />}</div>
          </Card>
        </motion.div>
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader><CardTitle>Допуск</CardTitle></CardHeader>
              <div className="flex flex-col gap-4 p-4 sm:p-6">
                <div className="flex flex-wrap gap-2">{w.zoneIds.map((z) => <Status key={z} tone="success">{db.zones.find((x) => x.id === z)?.name}</Status>)}</div>
                <Field label="Инструктаж и медосмотр до"><DatePicker value={w.permitUntil} onChange={(v) => api.updateWorker(w.id, { permitUntil: v })} /></Field>
                <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2.5 text-sm"><span className="text-muted-foreground">Смена сегодня</span><span className="font-medium tabular-nums">{sh ? `${sh.start}–${sh.end}` : "нет"}</span></div>
              </div>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader><CardTitle>Устройства</CardTitle></CardHeader>
              <div className="flex flex-col gap-1 p-2 sm:p-3">
                {devices.length === 0 && <div className="px-2 py-3 text-sm text-muted-foreground">Пропуск ещё не активирован</div>}
                {devices.map((d) => (
                  <div key={d.id} className="flex min-w-0 items-center gap-3 rounded-md px-2 py-2 text-sm">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface text-muted-foreground"><Smartphone className="size-4" /></span>
                    <div className="min-w-0 flex-1"><div className="truncate font-medium">{d.label}</div><div className="truncate text-xs text-muted-foreground">{dateRu(d.createdAt)} · {d.id}</div></div>
                    {d.revokedAt ? <Status>отвязан</Status> : <Button variant="quiet" size="icon-sm" aria-label="Отвязать" onClick={() => api.revokeDevice(d.id).then(() => toast.info("Телефон отвязан — его QR больше не пройдёт"))}><Trash2 /></Button>}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
      <Dialog open={invite} onClose={() => setInvite(false)} title="Приглашение" description="Отсканируйте камерой смартфона, чтобы активировать пропуск сотрудника"><InviteCard w={w} /></Dialog>
    </motion.div>
  );
};
