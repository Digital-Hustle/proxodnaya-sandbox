import { useState } from "react";
import { NavLink, Link, Outlet, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { LayoutGrid, Users, ScrollText, CalendarClock, BarChart3, Sparkles, Settings, MoreHorizontal, ScanLine, Home, ChevronRight } from "lucide-react";
import { Logo, ThemeSwitcher, OfflineBanner, Dialog, Button } from "@/shared/ui";
import { routes } from "@/shared/const/router";
import { cn } from "@/shared/lib";
import { pageIn, press, spring } from "@/shared/config/motion";

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

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Шапка-пилюля, как на sberbank.ru */}
      <header className="sticky top-0 z-nav px-3 pt-safe sm:px-6">
        <div className="mx-auto mt-2 flex h-14 max-w-7xl items-center gap-3 rounded-lg bg-card px-2.5 shadow-float sm:mt-3 sm:h-16 sm:gap-4 sm:px-3">
          <Link to={routes.home} className="shrink-0 rounded-sm px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"><Logo sub="админка · песочница" /></Link>
          <nav className="scrollbar-none hidden min-w-0 flex-1 justify-center overflow-x-auto lg:flex" aria-label="Разделы">
            <div className="flex rounded-md bg-surface p-1">
              {NAV.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("relative flex h-9 shrink-0 items-center whitespace-nowrap rounded-sm px-3 text-sm font-medium outline-none transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-ring xl:px-4", isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {({ isActive }) => (<>
                    {isActive && <motion.span layoutId="admin-nav" transition={spring.snappy} className="absolute inset-0 rounded-sm bg-card shadow-xs" />}
                    <span className="relative z-raised">{label}</span>
                  </>)}
                </NavLink>
              ))}
            </div>
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <ThemeSwitcher className="hidden sm:inline-flex" />
            <Link to={routes.kiosk} target="_blank" className="hidden md:block" tabIndex={-1}><Button variant="secondary" size="sm"><ScanLine />Киоск</Button></Link>
            <Link to={routes.kiosk} target="_blank" className="md:hidden" tabIndex={-1}><Button variant="secondary" size="icon-sm" aria-label="Открыть киоск"><ScanLine /></Button></Link>
          </div>
        </div>
      </header>

      <OfflineBanner />
      <motion.main key={loc.pathname} {...pageIn} className="mx-auto w-full max-w-7xl px-4 pb-nav pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
        <Outlet />
      </motion.main>

      {/* Нижняя навигация телефона: плавающая панель */}
      <nav className="fixed inset-x-0 bottom-0 z-nav px-3 pb-safe lg:hidden" aria-label="Разделы">
        <div className="mx-auto mb-3 flex max-w-md items-stretch gap-1 rounded-lg bg-card p-1.5 shadow-float">
          {MOBILE.map(({ to, short, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("relative flex min-h-control-lg min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-xs font-medium outline-none", isActive ? "text-accent-foreground" : "text-muted-foreground")}>
              {({ isActive }) => (<>
                {isActive && <motion.span layoutId="admin-tab" transition={spring.snappy} className="absolute inset-0 rounded-md bg-accent" />}
                <Icon className="relative z-raised size-5" /><span className="relative z-raised max-w-full truncate px-0.5">{short}</span>
              </>)}
            </NavLink>
          ))}
          <motion.button type="button" {...press} onClick={() => setMore(true)} className={cn("relative flex min-h-control-lg min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-xs font-medium", inMore ? "text-accent-foreground" : "text-muted-foreground")}>
            {inMore && <motion.span layoutId="admin-tab" transition={spring.snappy} className="absolute inset-0 rounded-md bg-accent" />}
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
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border px-3 pt-4">
            <span className="text-sm font-medium">Тема</span><ThemeSwitcher />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
