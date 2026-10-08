import { useEffect, useState } from "react";
import { NavLink, Outlet, Navigate, useLocation, Link } from "react-router";
import { motion } from "motion/react";
import { QrCode, History, CalendarDays } from "lucide-react";
import { loadKey, cn, type StoredKey } from "@/shared/lib";
import { Logo, OfflineBanner, Skeleton, PreferencesButton, InstallButton, HeaderBar, TrackIndicator, useTrackIndicator } from "@/shared/ui";
import { routes } from "@/shared/const/router";
import { pageIn } from "@/shared/config/motion";

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
  const ind = useTrackIndicator(loc.pathname + String(key === undefined));
  useEffect(() => { loadKey("phone").then((k) => setKey(k ?? null)).catch(() => setKey(null)); }, [loc.pathname]);
  if (key === null) return <Navigate to={routes.workerActivate + loc.search} replace />;
  return (
    <div className="relative isolate min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col">
        <HeaderBar className="px-3 sm:px-3" inner="justify-between">
          <Link to={routes.home} className="min-w-0 px-1.5"><Logo sub="пропуск" /></Link>
          <div className="flex items-center gap-2"><InstallButton /><PreferencesButton /></div>
        </HeaderBar>
        <OfflineBanner text="Нет сети. QR-пропуск работает офлайн" />
        {key === undefined ? (
          <div className="flex flex-col gap-4 px-4 pt-4"><Skeleton className="h-16" /><Skeleton className="h-96 rounded-xl" /><Skeleton className="h-20" /></div>
        ) : (
          <motion.main key={loc.pathname} {...pageIn} className="flex-1 px-4 pb-nav pt-4">
            <Outlet context={{ key } satisfies WorkerCtx} />
          </motion.main>
        )}
        <nav className="fixed inset-x-0 bottom-0 z-nav px-4 pb-safe" aria-label="Разделы">
          <div ref={ind.ref} className="relative mx-auto mb-3 flex max-w-sm gap-1 rounded-xl bg-card/90 p-1.5 shadow-float backdrop-blur-xl">
            <TrackIndicator ind={ind} className="inset-y-1.5 rounded-lg bg-accent" />
            {TABS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("relative flex min-h-control-lg flex-1 items-center justify-center gap-2 rounded-md text-sm font-medium", isActive ? "text-accent-foreground" : "text-muted-foreground")}>
                <Icon className="relative z-raised size-5" /><span className="relative z-raised">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};
