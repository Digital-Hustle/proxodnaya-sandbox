import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router";
import { HardHat } from "lucide-react";
import { presenceNow, useDb } from "@/shared/api";
import { WorkerCell } from "@/entities/worker";
import { EmptyState } from "@/shared/ui";
import { durationRu } from "@/shared/lib";
import { useNow } from "@/shared/hooks";
import { routes } from "@/shared/const/router";
import { popIn } from "@/shared/config/motion";

export const OnSiteNow = () => {
  const db = useDb();
  const now = useNow(30000);
  const list = useMemo(() => presenceNow(db).sort((a, b) => a.since - b.since), [db]);
  if (!list.length) return <EmptyState icon={<HardHat />} title="На объекте никого" text="Как только кто-то войдёт через киоск, он появится здесь" />;
  return (
    <div className="grid gap-1 sm:grid-cols-2">
      <AnimatePresence initial={false}>
        {list.map((p) => {
          const w = db.workers.find((x) => x.id === p.workerId);
          if (!w) return null;
          return (
            <motion.div key={p.workerId} layout variants={popIn} initial="hidden" animate="show" exit="exit">
              <Link to={routes.adminPerson(w.id)} className="block min-w-0 rounded-md p-2.5 transition-colors duration-fast hover:bg-muted">
                <WorkerCell w={w} sub={`${db.zones.find((z) => z.id === p.zoneId)?.name} · ${durationRu(now - p.since)}`} />
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
