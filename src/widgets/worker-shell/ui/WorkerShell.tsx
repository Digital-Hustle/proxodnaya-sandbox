import { useEffect, useState } from "react";
import { NavLink, Outlet, Navigate, useLocation, Link } from "react-router";
import { motion } from "motion/react";
import { QrCode, History, CalendarDays } from "lucide-react";
import { loadKey, cn, type StoredKey } from "@/shared/lib";
import { Logo, OfflineBanner, Spinner, ThemeToggle } from "@/shared/ui";
import { routes } from "@/shared/const/router";
import { spring, tween } from "@/shared/config/motion";

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
  if (key === undefined) return <div className="flex min-h-dvh items-center justify-center"><Spinner className="size-8 text-brand" /></div>;
  if (key === null) return <Navigate to={routes.workerActivate + loc.search} replace />;
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <header className="sticky top-0 z-sticky flex items-center justify-between bg-background/80 px-5 py-3 pt-safe backdrop-blur-md">
        <Link to={routes.home}><Logo /></Link>
        <ThemeToggle />
      </header>
      <OfflineBanner text="Нет связи — QR всё равно работает" />
      <motion.main key={loc.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={tween.base} className="flex-1 px-5 pb-16 pt-2">
        <Outlet context={{ key } satisfies WorkerCtx} />
      </motion.main>
      <nav className="sticky bottom-0 z-sticky flex gap-1 border-t border-border/60 bg-card/90 px-3 pb-safe pt-2 backdrop-blur-md">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("relative flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-xs font-semibold", isActive ? "text-accent-foreground" : "text-muted-foreground")}>
            {({ isActive }) => (<>
              {isActive && <motion.span layoutId="worker-tab" transition={spring.snappy} className="absolute inset-0 rounded-md bg-accent" />}
              <Icon className="relative size-6" /><span className="relative">{label}</span>
            </>)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
