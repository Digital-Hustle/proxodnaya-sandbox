import { useEffect, useState } from "react";
import { NavLink, Outlet, Navigate, useLocation, Link } from "react-router";
import { motion } from "motion/react";
import { QrCode, History, CalendarDays } from "lucide-react";
import { loadKey, cn, type StoredKey } from "@/shared/lib";
import { Logo, OfflineBanner, Skeleton, ThemeSwitcher } from "@/shared/ui";
import { routes } from "@/shared/const/router";
import { pageIn, spring } from "@/shared/config/motion";

const TABS = [
  { to: routes.worker, label: "Пропуск", icon: QrCode, end: true },
  { to: routes.workerHistory, label: "История", icon: History },
  { to: routes.workerShifts, label: "Смены", icon: CalendarDays },
];

export type WorkerCtx = { key: StoredKey };

/** Оболочка PWA рабочего: без ключа устройства — на активацию. */
export const WorkerShell = () => {
  const [key, setKey] = useState<StoredKey | null | undefined>(undefined);
  const loc = useLocation();
  useEffect(() => { loadKey("phone").then((k) => setKey(k ?? null)).catch(() => setKey(null)); }, [loc.pathname]);
  if (key === null) return <Navigate to={routes.workerActivate + loc.search} replace />;
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col">
        <header className="sticky top-0 z-nav bg-background/85 px-4 pt-safe backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link to={routes.home} className="min-w-0"><Logo sub="пропуск" /></Link>
            <ThemeSwitcher />
          </div>
        </header>
        <OfflineBanner text="Нет связи — QR всё равно работает" />
        {key === undefined ? (
          <div className="flex flex-col gap-4 px-4 pt-2"><Skeleton className="h-16" /><Skeleton className="h-96 rounded-xl" /><Skeleton className="h-20" /></div>
        ) : (
          <motion.main key={loc.pathname} {...pageIn} className="flex-1 px-4 pb-nav pt-1">
            <Outlet context={{ key } satisfies WorkerCtx} />
          </motion.main>
        )}
        <nav className="fixed inset-x-0 bottom-0 z-nav px-4 pb-safe" aria-label="Разделы">
          <div className="mx-auto mb-3 flex max-w-sm gap-1 rounded-lg bg-card p-1.5 shadow-float">
            {TABS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("relative flex min-h-control-lg flex-1 items-center justify-center gap-2 rounded-md text-sm font-medium", isActive ? "text-accent-foreground" : "text-muted-foreground")}>
                {({ isActive }) => (<>
                  {isActive && <motion.span layoutId="worker-tab" transition={spring.snappy} className="absolute inset-0 rounded-md bg-accent" />}
                  <Icon className="relative z-raised size-5" /><span className="relative z-raised">{label}</span>
                </>)}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};
