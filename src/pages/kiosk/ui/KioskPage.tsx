import { useEffect, useState } from "react";
import { Link } from "react-router";
import { LogIn, LogOut, FlaskConical, Maximize } from "lucide-react";
import { useDb, type Direction } from "@/shared/api";
import { Aurora, Button, Logo, Segmented, Select } from "@/shared/ui";
import { useNow, useOnline } from "@/shared/hooks";
import { hhmm, cn } from "@/shared/lib";
import { routes } from "@/shared/const/router";
import { KioskTerminal } from "@/widgets/kiosk-terminal";

/** Киоск всегда в тёмной теме: экран у турникета не должен слепить. Тема сайта возвращается при уходе. */
const useForceDark = () => useEffect(() => {
  const html = document.documentElement;
  const had = html.classList.contains("dark");
  html.classList.add("dark");
  return () => { if (!had) html.classList.remove("dark"); };
}, []);

export const KioskPage = () => {
  useForceDark();
  const db = useDb();
  const now = useNow(10000);
  const online = useOnline();
  const [direction, setDirection] = useState<Direction>("IN");
  const [checkpointId, setCheckpointId] = useState(db.checkpoints[0]?.id ?? "cp_main");
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="relative isolate flex h-dvh flex-col gap-3 px-3 pb-3 pt-safe text-foreground sm:gap-4 sm:px-5 sm:pb-5">
      <Aurora fixed tone="kiosk" intensity={0.55} />
      <header className="flex shrink-0 items-center gap-2 pt-3 sm:gap-3 sm:pt-4">
        <Link to={routes.home} className="shrink-0"><Logo compact className="sm:hidden" /><Logo sub="киоск" className="hidden sm:inline-flex" /></Link>
        <Select size="sm" value={checkpointId} onChange={setCheckpointId} aria-label="Проходная" className="w-auto min-w-0 max-w-60 flex-1 sm:ml-3 sm:flex-none"
          options={db.checkpoints.map((c) => ({ value: c.id, label: c.name }))} />
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <span className={cn("size-2 rounded-full", online ? "bg-success" : "bg-warning")} />{online ? "Связь есть" : "Нет связи"}
          </span>
          <span className="font-display text-xl font-semibold tabular-nums tracking-display sm:text-2xl">{hhmm(now)}</span>
          <Button variant="secondary" size="sm" onClick={() => setDemoOpen(true)} className="hidden sm:inline-flex"><FlaskConical />Демо</Button>
          <Button variant="secondary" size="icon-sm" onClick={() => setDemoOpen(true)} className="sm:hidden" aria-label="Демо-пульт"><FlaskConical /></Button>
          <Button variant="quiet" size="icon-sm" aria-label="Во весь экран" className="hidden sm:inline-flex" onClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}><Maximize /></Button>
        </div>
      </header>
      <Segmented size="lg" block value={direction} onChange={setDirection} label="Направление" className="shrink-0"
        options={[{ value: "IN", label: "Вход", icon: <LogIn /> }, { value: "OUT", label: "Выход", icon: <LogOut /> }]} />
      <KioskTerminal direction={direction} checkpointId={checkpointId} demoOpen={demoOpen} setDemoOpen={setDemoOpen} />
    </div>
  );
};
