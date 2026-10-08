import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, CameraOff, QrCode, ScanFace } from "lucide-react";
import { api, type Challenge, type DecisionResult, type Direction } from "@/shared/api";
import { useCamera } from "@/shared/hooks";
import { Button, Spinner } from "@/shared/ui";
import { cn } from "@/shared/lib";
import { spring, tween, popIn, duration, ease } from "@/shared/config/motion";
import { useQrScanner } from "@/features/scan-qr";
import { ChallengePrompt, sampleFrames, syntheticFrames } from "@/features/face-challenge";
import { DemoPanel, useKioskDemo } from "@/features/kiosk-demo";
import { DecisionScreen } from "./DecisionScreen";

type State =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "challenge"; challenge: Challenge; name: string; progress: number }
  | { kind: "deciding" }
  | { kind: "result"; result: DecisionResult };

const CAPTURE_MS = 3500;
const CORNERS = ["left-0 top-0 rounded-tl-lg border-l-4 border-t-4", "right-0 top-0 rounded-tr-lg border-r-4 border-t-4", "bottom-0 left-0 rounded-bl-lg border-b-4 border-l-4", "bottom-0 right-0 rounded-br-lg border-b-4 border-r-4"];
const sweep = { duration: duration.loop, repeat: Infinity, ease: ease.inOut } as const;

export const KioskTerminal = ({ direction, checkpointId, demoOpen, setDemoOpen }: { direction: Direction; checkpointId: string; demoOpen: boolean; setDemoOpen: (v: boolean) => void }) => {
  const cam = useCamera("user");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [noCamera, setNoCamera] = useState(false);
  const { setLastQr } = useKioskDemo();

  useEffect(() => { cam.start(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const cameraOn = cam.state === "on" && !noCamera;

  const handleQr = useCallback(async (raw: string) => {
    setLastQr(raw);
    setState({ kind: "checking" });
    try {
      const res = await api.kioskScan(raw, direction, checkpointId);
      if (res.kind === "decision") { setState({ kind: "result", result: res.result }); return; }
      setState({ kind: "challenge", challenge: res.challenge, name: res.worker.fullName.split(" ")[1] ?? res.worker.fullName, progress: 0 });
      const started = Date.now();
      const progressId = setInterval(() => setState((s) => (s.kind === "challenge" ? { ...s, progress: Math.min(1, (Date.now() - started) / CAPTURE_MS) } : s)), 100);
      const photo = useKioskDemo.getState().photoAttack;
      const frames = cameraOn && !photo ? await sampleFrames(cam.videoRef.current, CAPTURE_MS) : (await new Promise((r) => setTimeout(r, CAPTURE_MS)), syntheticFrames(!photo));
      clearInterval(progressId);
      setState({ kind: "deciding" });
      setState({ kind: "result", result: await api.kioskFrames(res.token, frames) });
    } catch {
      setState({ kind: "result", result: { attemptId: "-", decision: "ERROR", code: "SYSTEM_ERROR", message: "Система недоступна, проход закрыт", hint: "Обратитесь к охране", direction, ts: Date.now() } });
    }
  }, [direction, checkpointId, cameraOn, cam.videoRef, setLastQr]);

  useQrScanner(cam.videoRef, cameraOn && state.kind === "idle" && !demoOpen, handleQr);

  const manual = async (workerId: string, note: string) => setState({ kind: "result", result: await api.kioskManual(workerId, direction, checkpointId, note) });
  const reset = useCallback(() => setState({ kind: "idle" }), []);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-card shadow-card">
      <video ref={cam.videoRef} playsInline muted className={cn("absolute inset-0 size-full -scale-x-100 object-cover transition-opacity duration-slow", cameraOn ? "opacity-100" : "opacity-0")} />
      {!cameraOn && <div aria-hidden className="absolute inset-0 bg-glow" />}
      {cameraOn && <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-black/30" />}

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-5 text-center sm:gap-8 sm:p-8">
        <AnimatePresence mode="wait">
          {state.kind === "idle" && (
            <motion.div key="idle" variants={popIn} initial="hidden" animate="show" exit="exit" className="flex w-full flex-col items-center gap-6 sm:gap-8">
              <div className="relative size-44 shrink-0 sm:size-64">
                {CORNERS.map((c) => <span key={c} className={cn("absolute size-10 border-white sm:size-14", c)} />)}
                <motion.div className="absolute inset-x-5 h-1 rounded-full bg-brand-gradient" animate={{ top: ["12%", "88%", "12%"] }} transition={sweep} />
                {!cameraOn && <div className="absolute inset-0 flex items-center justify-center text-white/50"><QrCode className="size-16 sm:size-20" strokeWidth={1.5} /></div>}
              </div>
              <div className="flex flex-col items-center gap-2">
                <h1 className="text-balance font-display text-3xl font-medium tracking-display text-white sm:text-4xl lg:text-5xl">{direction === "IN" ? "Покажите QR для входа" : "Покажите QR для выхода"}</h1>
                <p className="text-balance text-base text-white/70 sm:text-lg">{cameraOn ? "Поднесите экран телефона к камере" : "Камера выключена — можно пройти через демо-пульт"}</p>
              </div>
              {!cameraOn && (
                <div className="flex w-full max-w-sm flex-col gap-2 sm:w-auto sm:max-w-none sm:flex-row sm:gap-3">
                  {!noCamera && cam.state !== "on" && <Button variant="secondary" size="lg" onClick={() => cam.start()}><Camera />Включить камеру</Button>}
                  {noCamera && <Button variant="secondary" size="lg" onClick={() => setNoCamera(false)}><Camera />Вернуть камеру</Button>}
                  <Button size="lg" onClick={() => setDemoOpen(true)}><ScanFace />Демо-пропуск</Button>
                </div>
              )}
              {(cam.state === "denied" || cam.state === "unavailable") && <p className="text-sm text-white/60">{cam.state === "denied" ? "Доступ к камере запрещён в браузере" : "Камера не найдена"}</p>}
            </motion.div>
          )}
          {(state.kind === "checking" || state.kind === "deciding") && (
            <motion.div key="busy" variants={popIn} initial="hidden" animate="show" exit="exit" className="flex items-center gap-4 rounded-lg bg-popover/90 px-6 py-5 text-popover-foreground shadow-pop backdrop-blur-md sm:px-8">
              <Spinner className="size-7 border-3 text-brand" />
              <span className="font-display text-xl font-medium tracking-display sm:text-2xl">{state.kind === "checking" ? "Проверяем пропуск…" : "Сверяем лицо…"}</span>
            </motion.div>
          )}
          {state.kind === "challenge" && (
            <motion.div key="challenge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={tween.fast} className="flex w-full justify-center">
              <ChallengePrompt challenge={state.challenge} name={state.name} progress={state.progress} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {cameraOn && state.kind === "idle" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={spring.soft} className="relative flex justify-center pb-4">
            <Button variant="secondary" size="sm" onClick={() => setNoCamera(true)} className="bg-black/40 text-white backdrop-blur-md hover:bg-black/55"><CameraOff />Без камеры</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{state.kind === "result" && <DecisionScreen key={state.result.attemptId + state.result.ts} result={state.result} onDone={reset} />}</AnimatePresence>
      <DemoPanel open={demoOpen} onClose={() => setDemoOpen(false)} onScan={handleQr} onManual={manual} />
    </div>
  );
};
