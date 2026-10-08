import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Search, UserPlus, Users, ChevronRight } from "lucide-react";
import { useDb, presenceNow } from "@/shared/api";
import { Button, Card, EmptyState, Input, Segmented, PageHeader } from "@/shared/ui";
import { WorkerCell, WorkerStatusBadge } from "@/entities/worker";
import { routes } from "@/shared/const/router";
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
      <PageHeader title="Люди" sub={`${db.workers.length} в базе · ${inside.size} на объекте`} actions={<Link to={routes.adminPersonNew} tabIndex={-1}><Button><UserPlus />Новый сотрудник</Button></Link>} />
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:gap-3">
        <Input icon={<Search />} value={q} onChange={(e) => { setQ(e.target.value); setSp((p) => { p.set("q", e.target.value); return p; }, { replace: true }); }} placeholder="ФИО, должность, подрядчик" aria-label="Поиск" className="bg-card" />
        <Segmented value={f} onChange={(v) => setSp((p) => { p.set("f", v); return p; }, { replace: true })} label="Фильтр" className="shrink-0 self-start sm:self-auto"
          options={[{ value: "all", label: "Все" }, { value: "inside", label: "На объекте" }, { value: "blocked", label: "Заблокированы" }]} />
      </div>
      <Card className="overflow-hidden">
        {list.length === 0 ? <EmptyState icon={<Users />} title="Никого не нашли" text="Измените фильтр или заведите сотрудника" /> : (
          <motion.ul variants={stagger(0.02)} initial="hidden" animate="show">
            {list.map((w) => (
              <motion.li key={w.id} variants={fadeUp} className="border-t border-border first:border-t-0">
                <Link to={routes.adminPerson(w.id)} className="group flex min-w-0 items-center gap-3 px-4 py-3 transition-colors duration-fast hover:bg-muted sm:gap-4 sm:px-6">
                  <WorkerCell w={w} className="min-w-0 flex-1" />
                  <span className="hidden w-40 shrink-0 truncate text-sm text-muted-foreground md:block">{w.contractor}</span>
                  <span className="hidden sm:block"><WorkerStatusBadge w={w} inside={inside.has(w.id)} /></span>
                  <span className={`size-2 shrink-0 rounded-full sm:hidden ${w.status === "blocked" ? "bg-danger" : inside.has(w.id) ? "bg-success" : "bg-border-strong"}`} aria-hidden />
                  <ChevronRight className="size-4 shrink-0 text-subtle-foreground transition-transform duration-fast group-hover:translate-x-0.5" />
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </Card>
    </div>
  );
};
