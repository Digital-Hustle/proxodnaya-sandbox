import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Search, UserPlus, Users } from "lucide-react";
import { useDb, presenceNow } from "@/shared/api";
import { Button, Card, EmptyState, Input, Segmented } from "@/shared/ui";
import { WorkerCell, WorkerStatusBadge } from "@/entities/worker";
import { routes } from "@/shared/const/router";
import { PageHeader } from "@/widgets/admin-shell";
import { fadeUp, stagger } from "@/shared/config/motion";

type F = "all" | "inside" | "blocked";

export const PeoplePage = () => {
  const db = useDb();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const f = (sp.get("f") as F) ?? "all";
  const inside = useMemo(() => new Set(presenceNow(db).map((p) => p.workerId)), [db]);
  const list = db.workers
    .filter((w) => (f === "inside" ? inside.has(w.id) : f === "blocked" ? w.status === "blocked" : true))
    .filter((w) => `${w.fullName} ${w.position} ${w.contractor}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  return (
    <div>
      <PageHeader title="Люди" sub={`${db.workers.length} в базе · ${inside.size} на объекте`} actions={<Link to={routes.adminPersonNew}><Button><UserPlus />Новый сотрудник</Button></Link>} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setSp((p) => { p.set("q", e.target.value); return p; }, { replace: true }); }} placeholder="ФИО, должность, подрядчик" className="pl-12" /></div>
        <Segmented value={f} onChange={(v) => setSp((p) => { p.set("f", v); return p; }, { replace: true })} options={[{ value: "all", label: "Все" }, { value: "inside", label: "На объекте" }, { value: "blocked", label: "Заблок." }]} />
      </div>
      <Card className="overflow-hidden">
        {list.length === 0 ? <EmptyState icon={<Users />} title="Никого не нашли" text="Измените фильтр или заведите сотрудника" /> : (
          <motion.div variants={stagger(0.02)} initial="hidden" animate="show" className="divide-y divide-border/60">
            {list.map((w) => (
              <motion.div key={w.id} variants={fadeUp}>
                <Link to={routes.adminPerson(w.id)} className="flex items-center gap-4 px-5 py-3 transition-colors duration-fast hover:bg-muted">
                  <WorkerCell w={w} className="flex-1" />
                  <span className="hidden w-40 truncate text-sm text-muted-foreground md:block">{w.contractor}</span>
                  <WorkerStatusBadge w={w} inside={inside.has(w.id)} />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </div>
  );
};
