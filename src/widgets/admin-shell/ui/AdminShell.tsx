import { useState } from "react";
import { NavLink, Link, Outlet, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { LayoutGrid, Users, ScrollText, CalendarClock, BarChart3, Sparkles, Settings, MoreHorizontal, ScanLine, Home, ChevronRight } from "lucide-react";
import { Logo, ThemePicker, PreferencesButton, OfflineBanner, Dialog, Button, Aurora, HeaderBar, NavTrack, TrackIndicator, useTrackIndicator } from "@/shared/ui";
import { routes } from "@/shared/const/router";
import { cn } from "@/shared/lib";
import { pageIn, press, duration } from "@/shared/config/motion";

const NAV = [
  { to: routes.admin, label: "Обстановка", short: "Сводка", icon: LayoutGrid, end: true },
  { to: routes.adminPeople, label: "Люди", short: "Люди", icon: Users },
  { to: routes.adminJournal, label: "Журнал", short: "Журнал", icon: ScrollText },
  { to: routes.adminShifts, label: "Смены", short: "Смены", icon: CalendarClock },
  { to: routes.adminAnalytics, label: "Аналитика", short: "Аналитика", icon: BarChart3 },
  { to: routes.adminAssistant, label: "Помощник", short: "Помощник", icon: Sparkles },
  { to: routes.adminSettings, label: "Настройки", short: "Настройки", icon: Settings },
];
const MOBILE = [NAV[0], NAV[1], NAV[2], NAV[5]];
const MORE = [NAV[3], NAV[4], NAV[6]];

export const AdminShell = () => {
  const loc = useLocation();
  const nav = useNavigate();
  const [more, setMore] = useState(false);
  const inMore = MORE.some((n) => loc.pathname.startsWith(n.to));
  const ind = useTrackIndicator(loc.pathname);

  return (
    <div className="relative isolate min-h-dvh text-foreground">
      <Aurora fixed intensity={0.35} />
      {/* Шапка-пилюля, как на sberbank.ru */}
      <HeaderBar>
        <Link to={routes.home} className="shrink-0 rounded-md px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"><Logo sub="администратор" /></Link>
        <NavTrack items={NAV.map(({ to, label, end }) => ({ to, label, end }))} className="ml-auto hidden lg:block xl:ml-6" />
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <PreferencesButton className="hidden lg:flex" />
          <Link to={routes.kiosk} target="_blank" className="hidden md:block" tabIndex={-1}><Button variant="brand" className="h-12 rounded-md"><ScanLine />Киоск</Button></Link>
          <Link to={routes.kiosk} target="_blank" className="md:hidden" tabIndex={-1}><Button variant="brand" size="icon" className="size-12" aria-label="Открыть киоск"><ScanLine /></Button></Link>
        </div>
      </HeaderBar>

      <OfflineBanner />
      <motion.main key={loc.pathname} {...pageIn} className="mx-auto w-full max-w-7xl px-4 pb-nav pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
        <Outlet />
      </motion.main>

      {/* Нижняя навигация телефона: плавающая панель */}
      <nav className="fixed inset-x-0 bottom-0 z-nav px-3 pb-safe lg:hidden" aria-label="Разделы">
        <div ref={ind.ref} className="relative mx-auto mb-3 flex max-w-md items-stretch gap-0.5 rounded-xl bg-card/90 p-1 shadow-float backdrop-blur-xl">
          <TrackIndicator ind={ind} className="inset-y-1 rounded-lg bg-accent" />
          {MOBILE.map(({ to, short, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("relative flex min-h-control-lg min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-xs font-medium outline-none", isActive ? "text-accent-foreground" : "text-muted-foreground")}>
              <Icon className="relative z-raised size-5" /><span className="relative z-raised max-w-full truncate tracking-tight">{short}</span>
            </NavLink>
          ))}
          <motion.button type="button" {...press} onClick={() => setMore(true)} data-active={inMore} className={cn("relative flex min-h-control-lg min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-xs font-medium", inMore ? "text-accent-foreground" : "text-muted-foreground")}>
            <MoreHorizontal className="relative z-raised size-5" /><span className="relative z-raised">Ещё</span>
          </motion.button>
        </div>
      </nav>

      <Dialog open={more} onClose={() => setMore(false)} title="Ещё">
        <div className="flex flex-col gap-1">
          {[...MORE, { to: routes.home, label: "На главную", icon: Home }].map(({ to, label, icon: Icon }) => (
            <button key={to} type="button" onClick={() => { setMore(false); nav(to); }}
              className={cn("flex min-h-control-lg items-center gap-3 rounded-md px-3 text-left text-base font-medium transition-colors duration-fast hover:bg-surface", loc.pathname.startsWith(to) && to !== routes.home && "bg-accent text-accent-foreground")}>
              <Icon className="size-5 shrink-0" /><span className="flex-1">{label}</span><ChevronRight className="size-4 text-subtle-foreground" />
            </button>
          ))}
          <div className="mt-3 flex flex-col gap-3 border-t border-border px-1 pt-4">
            <span className="px-2 text-sm font-medium text-muted-foreground">Оформление</span><ThemePicker onPick={() => setTimeout(() => setMore(false), duration.slow * 1000)} />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
