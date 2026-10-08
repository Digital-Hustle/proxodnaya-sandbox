import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FlaskConical, Maximize } from "lucide-react";
import { api, useDb, terminalModeOf, offlinePolicyOf, type DecisionResult } from "@/shared/api";
import { Button, Logo } from "@/shared/ui";
import { useNow, useOnline } from "@/shared/hooks";
import { hhmm, cn, randomId } from "@/shared/lib";
import { tween } from "@/shared/config/motion";
import { KioskTerminal, PairingScreen, OfflineScreen, ServicePanel, DecisionScreen, MODE_LABEL } from "@/widgets/kiosk-terminal";

/** Киоск всегда в тёмной теме: экран у турникета не должен слепить. Тема сайта возвращается при уходе. */
const useForceDark = () => useEffect(() => {
  const html = document.documentElement;
  const had = html.classList.contains("dark");
  html.classList.add("dark");
  return () => { if (!had) html.classList.remove("dark"); };
}, []);

const KEY = "proxodnaya.kiosk.id";
/** Стабильный идентификатор терминала (в продукте — ключ устройства, созданный при первом запуске). */
const useKioskId = () => useState(() => {
  let id = localStorage.getItem(KEY);
  if (!id) { id = randomId("k", 8); localStorage.setItem(KEY, id); }
  return id;
})[0];

export const KioskPage = () => {
  useForceDark();
  const db = useDb();
  const now = useNow(10000);
  const netOnline = useOnline();
  const kioskId = useKioskId();
  const kiosk = db.kiosks?.find((k) => k.id === kioskId);
  const checkpoint = db.checkpoints.find((c) => c.id === kiosk?.checkpointId);
  const paired = !!kiosk?.pairedAt && !!checkpoint;
  const mode = terminalModeOf(db, kiosk);
  const [simOffline, setSimOffline] = useState(false);
  const online = netOnline && !simOffline;
  const [demoOpen, setDemoOpen] = useState(false);
  const [service, setService] = useState(false);
  const [offlineResult, setOfflineResult] = useState<DecisionResult | null>(null);
  const hold = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Киоск представляется серверу и шлёт пульс — админка видит, что он на связи.
  useEffect(() => {
    if (!online) return;
    api.kioskHello(kioskId);
    const t = setInterval(() => api.kioskHello(kioskId), 30000);
    return () => clearInterval(t);
  }, [kioskId, online]);

  const startHold = () => { hold.current = setTimeout(() => setService(true), 1000); };
  const endHold = () => clearTimeout(hold.current);
  const view = !paired ? "pair" : online ? "live" : "offline";

  return (
    <div className="flex h-dvh flex-col gap-3 bg-background/30 px-3 pb-3 pt-safe text-foreground sm:gap-4 sm:px-5 sm:pb-5">
      <header className="flex shrink-0 items-center gap-2 pt-3 sm:gap-3 sm:pt-4">
        <button type="button" aria-label="Сервисная панель (удерживайте)" onPointerDown={startHold} onPointerUp={endHold} onPointerLeave={endHold} onContextMenu={(e) => e.preventDefault()}
          className="shrink-0 select-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring" onKeyDown={(e) => { if (e.key === "Enter" && e.shiftKey) setService(true); }}>
          <Logo compact className="sm:hidden" /><Logo sub="терминал" className="hidden sm:inline-flex" />
        </button>
        {paired && (
          <div className="min-w-0 sm:ml-3">
            <div className="truncate text-sm font-medium">{checkpoint.name}</div>
            <div className="hidden truncate text-xs text-muted-foreground sm:block">{MODE_LABEL[mode]}</div>
          </div>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <span className={cn("size-2 rounded-full", online ? "bg-success" : "bg-warning")} />{online ? "Связь есть" : "Нет связи"}
          </span>
          <span className="font-display text-xl font-semibold tabular-nums tracking-display sm:text-2xl">{hhmm(now)}</span>
          {view === "live" && <>
            <Button variant="secondary" size="sm" onClick={() => setDemoOpen(true)} className="hidden sm:inline-flex"><FlaskConical />Демо</Button>
            <Button variant="secondary" size="icon-sm" onClick={() => setDemoOpen(true)} className="sm:hidden" aria-label="Демо-пульт"><FlaskConical /></Button>
          </>}
          <Button variant="quiet" size="icon-sm" aria-label="Во весь экран" className="hidden sm:inline-flex" onClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}><Maximize /></Button>
        </div>
      </header>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={view + (kiosk?.pairCode ?? "")} className="relative flex min-h-0 flex-1 flex-col" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={tween.base}>
          {view === "pair" && <PairingScreen code={kiosk?.pairCode ?? "••••••"} />}
          {view === "live" && checkpoint && <KioskTerminal checkpointId={checkpoint.id} mode={mode} demoOpen={demoOpen} setDemoOpen={setDemoOpen} />}
          {view === "offline" && checkpoint && <OfflineScreen policy={offlinePolicyOf(db, kiosk)} checkpointId={checkpoint.id} onResult={setOfflineResult} />}
          <AnimatePresence>{view === "offline" && offlineResult && <DecisionScreen key={offlineResult.attemptId} result={offlineResult} onDone={() => setOfflineResult(null)} />}</AnimatePresence>
        </motion.div>
      </AnimatePresence>
      <ServicePanel open={service} onClose={() => setService(false)} kioskId={kioskId} kiosk={kiosk} simOffline={simOffline} setSimOffline={setSimOffline} onDemo={() => setDemoOpen(true)} />
    </div>
  );
};
