import { useState } from "react";
import { Link } from "react-router";
import { LogIn, LogOut, FlaskConical, Maximize, Wifi, WifiOff } from "lucide-react";
import { useDb, type Direction } from "@/shared/api";
import { Button, Logo, Segmented, Select } from "@/shared/ui";
import { useNow, useOnline } from "@/shared/hooks";
import { hhmm } from "@/shared/lib";
import { routes } from "@/shared/const/router";
import { KioskTerminal } from "@/widgets/kiosk-terminal";

export const KioskPage = () => {
  const db = useDb();
  const now = useNow(10000);
  const online = useOnline();
  const [direction, setDirection] = useState<Direction>("IN");
  const [checkpointId, setCheckpointId] = useState(db.checkpoints[0]?.id ?? "cp_main");
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="dark flex h-dvh flex-col gap-3 bg-background p-3 pt-safe text-foreground sm:gap-4 sm:p-4">
      <header className="flex flex-wrap items-center gap-3">
        <Link to={routes.home}><Logo /></Link>
        <Select value={checkpointId} onChange={(e) => setCheckpointId(e.target.value)} className="h-control-sm w-auto rounded-sm text-sm" aria-label="Проходная">
          {db.checkpoints.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">{online ? <Wifi className="size-4 text-brand" /> : <WifiOff className="size-4 text-warning" />}{online ? "связь есть" : "нет связи"}</span>
          <span className="font-display text-xl font-semibold tabular-nums">{hhmm(now)}</span>
          <Button variant="secondary" size="sm" onClick={() => setDemoOpen(true)}><FlaskConical />Демо</Button>
          <Button variant="ghost" size="icon" aria-label="Во весь экран" onClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}><Maximize /></Button>
        </div>
      </header>
      <Segmented size="lg" value={direction} onChange={setDirection} className="w-full"
        options={[{ value: "IN", label: <><LogIn />Вход</> }, { value: "OUT", label: <><LogOut />Выход</> }]} />
      <KioskTerminal direction={direction} checkpointId={checkpointId} demoOpen={demoOpen} setDemoOpen={setDemoOpen} />
    </div>
  );
};
