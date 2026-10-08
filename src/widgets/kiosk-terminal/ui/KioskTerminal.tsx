import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, CameraOff, QrCode, ScanFace } from "lucide-react";
import { api, type Challenge, type DecisionResult, type Direction } from "@/shared/api";
import { useCamera } from "@/shared/hooks";
import { Aurora, Button, Spinner } from "@/shared/ui";
import { cn } from "@/shared/lib";
import { spring, tween } from "@/shared/config/motion";
import { motion as m } from "@/shared/config/tokens";
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
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-black">
      <video ref={cam.videoRef} playsInline muted className={cn("absolute inset-0 size-full -scale-x-100 object-cover transition-opacity duration-slow", cameraOn ? "opacity-100" : "opacity-0")} />
      {!cameraOn && <Aurora dark intensity={0.75} />}
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative flex flex-1 flex-col items-center justify-center gap-8 p-6 text-white">
        <AnimatePresence mode="wait">
          {state.kind === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={spring.soft} className="flex flex-col items-center gap-8 text-center">
              <div className="relative size-64 sm:size-72">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={cn("absolute size-12 border-white", ["left-0 top-0 rounded-tl-xl border-l-4 border-t-4", "right-0 top-0 rounded-tr-xl border-r-4 border-t-4", "bottom-0 left-0 rounded-bl-xl border-b-4 border-l-4", "bottom-0 right-0 rounded-br-xl border-b-4 border-r-4"][i])} />
                ))}
                <motion.div className="absolute inset-x-4 h-1 rounded-full bg-brand-gradient shadow-pop" animate={{ top: ["8%", "92%", "8%"] }} transition={{ duration: m.duration.hero * 5, repeat: Infinity, ease: m.ease.inOut }} />
                <div className="absolute inset-0 flex items-center justify-center">{!cameraOn && <QrCode className="size-24 opacity-60" />}</div>
              </div>
              <div>
                <div className="font-display text-4xl font-semibold drop-shadow">{direction === "IN" ? "Покажите QR для входа" : "Покажите QR для выхода"}</div>
                <div className="mt-2 text-lg text-white/80">{cameraOn ? "Поднесите телефон к камере" : "Камера выключена — используйте демо-пульт"}</div>
              </div>
              {!cameraOn && (
                <div className="flex flex-wrap justify-center gap-3">
                  {!noCamera && cam.state !== "on" && <Button variant="glass" size="lg" onClick={() => cam.start()}><Camera />Включить камеру</Button>}
                  {noCamera && <Button variant="glass" size="lg" onClick={() => setNoCamera(false)}><Camera />Вернуть камеру</Button>}
                  <Button size="lg" onClick={() => setDemoOpen(true)}><ScanFace />Демо-пропуск</Button>
                </div>
              )}
              {cameraOn && <Button variant="glass" size="sm" onClick={() => setNoCamera(true)}><CameraOff />Без камеры</Button>}
              {(cam.state === "denied" || cam.state === "unavailable") && <div className="text-sm text-white/70">{cam.state === "denied" ? "Доступ к камере запрещён в браузере" : "Камера не найдена"}</div>}
            </motion.div>
          )}
          {(state.kind === "checking" || state.kind === "deciding") && (
            <motion.div key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={tween.fast} className="flex flex-col items-center gap-4 rounded-xl bg-black/40 px-10 py-8 backdrop-blur-md">
              <Spinner className="size-12 border-4" />
              <div className="text-2xl font-semibold">{state.kind === "checking" ? "Проверяем пропуск…" : "Сверяем лицо…"}</div>
            </motion.div>
          )}
          {state.kind === "challenge" && (
            <div key="challenge" className="text-foreground"><ChallengePrompt challenge={state.challenge} name={state.name} progress={state.progress} /></div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>{state.kind === "result" && <DecisionScreen key={state.result.attemptId + state.result.ts} result={state.result} onDone={reset} />}</AnimatePresence>
      <DemoPanel open={demoOpen} onClose={() => setDemoOpen(false)} onScan={handleQr} onManual={manual} />
    </div>
  );
};
