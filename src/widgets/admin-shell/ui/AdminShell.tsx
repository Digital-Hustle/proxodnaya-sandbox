import { useState } from "react";
import { NavLink, Link, Outlet, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { LayoutGrid, Users, ScrollText, CalendarClock, BarChart3, Sparkles, Settings, MoreHorizontal, ScanLine, Home, ChevronRight, MonitorSmartphone, UserCog, Lock } from "lucide-react";
import { useSession, can, roleLabel, ROLES, type Perm } from "@/entities/session";
import { AssistantFab } from "@/features/ask-assistant";
import { EmptyState, Logo, ThemePicker, PreferencesButton, OfflineBanner, Dialog, Button, Aurora, HeaderBar, NavTrack, TrackIndicator, useTrackIndicator } from "@/shared/ui";
import { routes } from "@/shared/const/router";
import { cn } from "@/shared/lib";
import { pageIn, press, duration } from "@/shared/config/motion";

const NAV: { to: string; label: string; short: string; icon: typeof Users; perm: Perm; end?: boolean }[] = [
  { to: routes.admin, label: "Обстановка", short: "Сводка", icon: LayoutGrid, perm: "dashboard", end: true },
  { to: routes.adminPeople, label: "Люди", short: "Люди", icon: Users, perm: "people" },
  { to: routes.adminJournal, label: "Журнал", short: "Журнал", icon: ScrollText, perm: "journal" },
  { to: routes.adminShifts, label: "Смены", short: "Смены", icon: CalendarClock, perm: "shifts" },
  { to: routes.adminAnalytics, label: "Аналитика", short: "Аналитика", icon: BarChart3, perm: "analytics" },
  { to: routes.adminAssistant, label: "Помощник", short: "Помощник", icon: Sparkles, perm: "assistant" },
  { to: routes.adminTerminals, label: "Терминалы", short: "Терминалы", icon: MonitorSmartphone, perm: "terminals" },
  { to: routes.adminSettings, label: "Настройки", short: "Настройки", icon: Settings, perm: "settings" },
];
const MOBILE_PREF: Perm[] = ["dashboard", "people", "journal", "assistant"];
const BY_LEN = [...NAV].sort((a, b) => b.to.length - a.to.length);

export const AdminShell = () => {
  const loc = useLocation();
  const nav = useNavigate();
  const [more, setMore] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const { role, setRole } = useSession();
  const items = NAV.filter((n) => can(role, n.perm));
  const MOBILE = items.filter((n) => MOBILE_PREF.includes(n.perm)).slice(0, 4);
  const MORE = items.filter((n) => !MOBILE.includes(n));
  const inMore = MORE.some((n) => loc.pathname.startsWith(n.to));
  const cur = BY_LEN.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)));
  const allowed = !cur || can(role, cur.perm);
  const ind = useTrackIndicator(loc.pathname);

  return (
    <div className="relative isolate min-h-dvh text-foreground">
      <Aurora fixed intensity={0.35} />
      {/* Шапка-пилюля, как на sberbank.ru */}
      <HeaderBar>
        <Link to={routes.home} className="shrink-0 rounded-md px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"><Logo sub="администратор" /></Link>
        <NavTrack items={items.map(({ to, label, end }) => ({ to, label, end }))} className="ml-auto hidden lg:block xl:ml-6" />
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Button variant="quiet" className="hidden h-12 rounded-md md:inline-flex" onClick={() => setRoleOpen(true)} aria-label={`Роль: ${roleLabel(role)}`}><UserCog /><span className="hidden 2xl:inline">{roleLabel(role)}</span></Button>
          <PreferencesButton className="hidden lg:flex" />
          <Link to={routes.kiosk} target="_blank" className="hidden md:block" tabIndex={-1}><Button variant="brand" className="h-12 rounded-md"><ScanLine />Киоск</Button></Link>
          <Link to={routes.kiosk} target="_blank" className="md:hidden" tabIndex={-1}><Button variant="brand" size="icon" className="size-12" aria-label="Открыть киоск"><ScanLine /></Button></Link>
        </div>
      </HeaderBar>

      <OfflineBanner />
      <motion.main key={loc.pathname} {...pageIn} className="mx-auto w-full max-w-7xl px-4 pb-nav pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
        {allowed ? <Outlet /> : <EmptyState icon={<Lock />} title="Нет доступа" text={`Роль «${roleLabel(role)}» не открывает этот раздел`} action={<Button variant="secondary" onClick={() => setRoleOpen(true)}><UserCog />Сменить роль</Button>} className="py-24" />}
      </motion.main>
      {can(role, "assistant") && !loc.pathname.startsWith(routes.adminAssistant) && <AssistantFab fullPath={routes.adminAssistant} />}

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
          <button type="button" onClick={() => { setMore(false); setRoleOpen(true); }} className="flex min-h-control-lg items-center gap-3 rounded-md px-3 text-left text-base font-medium transition-colors duration-fast hover:bg-surface">
            <UserCog className="size-5 shrink-0" /><span className="flex-1">Роль<span className="block text-sm font-normal text-muted-foreground">{roleLabel(role)}</span></span><ChevronRight className="size-4 text-subtle-foreground" />
          </button>
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

      <Dialog open={roleOpen} onClose={() => setRoleOpen(false)} title="Роль" description="Для демонстрации: в продукте роль задаёт администратор, а права проверяет сервер">
        <div role="radiogroup" aria-label="Роль" className="flex flex-col gap-2">
          {ROLES.map((r) => (
            <button key={r.id} type="button" role="radio" aria-checked={role === r.id} onClick={() => { setRole(r.id); setRoleOpen(false); }}
              className={cn("flex flex-col gap-0.5 rounded-lg border px-4 py-3 text-left outline-none transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-ring", role === r.id ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-surface")}>
              <span className="font-medium">{r.label}</span><span className="text-sm opacity-75">{r.text}</span>
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
};
