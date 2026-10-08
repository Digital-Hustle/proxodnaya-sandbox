import { NavLink, Link, Outlet, useLocation } from "react-router";
import { motion } from "motion/react";
import { LayoutDashboard, Users, ScrollText, CalendarClock, BarChart3, Sparkles, Settings, Home } from "lucide-react";
import { Logo, ThemeToggle, OfflineBanner } from "@/shared/ui";
import { routes } from "@/shared/const/router";
import { cn } from "@/shared/lib";
import { spring, tween } from "@/shared/config/motion";

const NAV = [
  { to: routes.admin, label: "Обстановка", icon: LayoutDashboard, end: true },
  { to: routes.adminPeople, label: "Люди", icon: Users },
  { to: routes.adminJournal, label: "Журнал", icon: ScrollText },
  { to: routes.adminShifts, label: "Смены", icon: CalendarClock },
  { to: routes.adminAnalytics, label: "Аналитика", icon: BarChart3 },
  { to: routes.adminAssistant, label: "Помощник", icon: Sparkles },
  { to: routes.adminSettings, label: "Настройки", icon: Settings },
];
const MOBILE = NAV.slice(0, 3).concat(NAV[5], NAV[6]);

export const AdminShell = () => {
  const loc = useLocation();
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-1 border-r border-border/60 bg-card p-4 lg:flex">
        <Link to={routes.home} className="mb-6 px-2 pt-2"><Logo /></Link>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("relative flex h-control-sm items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-fast", isActive ? "text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            {({ isActive }) => (<>
              {isActive && <motion.span layoutId="admin-nav" transition={spring.snappy} className="absolute inset-0 rounded-md bg-accent" />}
              <Icon className="relative size-5" /><span className="relative">{label}</span>
            </>)}
          </NavLink>
        ))}
        <div className="mt-auto flex items-center justify-between rounded-md bg-muted p-3">
          <div className="text-xs text-muted-foreground"><div className="font-semibold text-foreground">Администратор</div>песочница · моки</div>
          <ThemeToggle />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-sticky flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 pt-safe backdrop-blur-md lg:hidden">
          <Link to={routes.home}><Logo /></Link>
          <div className="flex items-center gap-1"><Link to={routes.home} className="p-2 text-muted-foreground"><Home className="size-5" /></Link><ThemeToggle /></div>
        </header>
        <OfflineBanner />
        <motion.main key={loc.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={tween.base} className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
          <Outlet />
        </motion.main>
        <nav className="fixed inset-x-0 bottom-0 z-sticky flex border-t border-border/60 bg-card/90 pb-safe backdrop-blur-md lg:hidden">
          {MOBILE.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium", isActive ? "text-accent-foreground" : "text-muted-foreground")}>
              <Icon className="size-5" />{label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export const PageHeader = ({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);
