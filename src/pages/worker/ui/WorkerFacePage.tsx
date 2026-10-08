import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Sun, Glasses, RotateCw, ScanFace, Upload, Check, RefreshCw, Clock3 } from "lucide-react";
import { api, useDb } from "@/shared/api";
import { Button, PageHeader, Spinner, toast } from "@/shared/ui";
import { sign } from "@/shared/lib";
import { useCamera } from "@/shared/hooks";
import { routes } from "@/shared/const/router";
import { sampleFrames, syntheticFrames } from "@/features/face-challenge";
import { duration, ease, fadeUp, popIn, spring, stagger, tween } from "@/shared/config/motion";
import type { WorkerCtx } from "@/widgets/worker-shell";

const SCAN_MS = 3600;
const PROMPTS = ["Поверните голову влево", "Теперь вправо", "Смотрите прямо"];
const TIPS = [
  { icon: Sun, title: "Хороший свет", text: "Лицо освещено спереди, без яркого окна за спиной" },
  { icon: Glasses, title: "Без очков и капюшона", text: "Лицо должно быть видно целиком" },
  { icon: RotateCw, title: "Медленно поверните голову", text: "Так терминал поймёт, что перед ним человек, а не фото" },
];
type Step = "intro" | "camera" | "scan" | "review" | "sending" | "done";

/** Кольцо прогресса вокруг кадра: заполняется за время сканирования. */
const Ring = ({ run }: { run: boolean }) => (
  <span aria-hidden className="pointer-events-none absolute -inset-3"><svg viewBox="0 0 100 100" className="size-full -rotate-90">
    <circle cx="50" cy="50" r="48" fill="none" strokeWidth="2.5" className="stroke-border" />
    <motion.circle cx="50" cy="50" r="48" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-brand"
      initial={{ pathLength: 0 }} animate={{ pathLength: run ? 1 : 0 }} transition={run ? { duration: SCAN_MS / 1000, ease: ease.linear } : tween.fast} />
  </svg></span>
);

/**
 * Лицо для прохода (ADR-046) — аналог Face ID на своём телефоне: короткое видео с поворотом головы
 * (проверка живости) и снимок-эталон. Запрос подписан ключом телефона. Эталон включается после проверки
 * службой безопасности — до этого на «QR + лицо» пропустит только охранник.
 */
export const WorkerFacePage = () => {
  const { key } = useOutletContext<WorkerCtx>();
  const db = useDb();
  const nav = useNavigate();
  const face = db.workers.find((w) => w.id === key.workerId)?.face;
  const cam = useCamera("user");
  const file = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(face?.status === "PENDING" ? "done" : "intro");
  const [prompt, setPrompt] = useState(0);
  const [shot, setShot] = useState<{ photo: string; frames: Awaited<ReturnType<typeof sampleFrames>> } | null>(null);
  const noCam = cam.state === "denied" || cam.state === "unavailable";

  useEffect(() => { if (step === "camera") cam.start(); if (step === "review" || step === "done") cam.stop(); }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const scan = async () => {
    setStep("scan"); setPrompt(0);
    const t1 = setTimeout(() => setPrompt(1), SCAN_MS / 3), t2 = setTimeout(() => setPrompt(2), (SCAN_MS * 2) / 3);
    const frames = await sampleFrames(cam.videoRef.current, SCAN_MS, 200);
    clearTimeout(t1); clearTimeout(t2);
    const photo = cam.snapshot(480);
    if (!photo) { toast.error("Не удалось получить кадр — попробуйте ещё раз"); setStep("camera"); return; }
    setShot({ photo, frames }); setStep("review");
  };
  const fromFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => { setShot({ photo: String(r.result), frames: syntheticFrames(true) }); setStep("review"); };
    r.readAsDataURL(f);
  };
  const send = async () => {
    if (!shot) return;
    setStep("sending");
    try {
      const at = Date.now();
      const signature = await sign(key.privateKey, api.faceMessage(key.workerId, key.deviceId, at));
      await api.enrollFace({ workerId: key.workerId, deviceId: key.deviceId, at, signature, photo: shot.photo, frames: shot.frames, publicKey: key.publicKey });
      setStep("done");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Не удалось отправить"); setStep("review"); }
  };

  return (
    <div>
      <PageHeader kicker="Профиль" title="Лицо для прохода" sub="Терминал на проходной сверяет лицо с эталоном — как Face ID, только у турникета" />
      <AnimatePresence mode="wait" initial={false}>
        {step === "intro" && (
          <motion.div key="intro" variants={stagger(0.06)} initial="hidden" animate="show" exit={{ opacity: 0, transition: tween.exit }} className="flex flex-col gap-3">
            {face?.status === "REJECTED" && <motion.p variants={fadeUp} className="rounded-xl bg-danger/10 p-4 text-sm text-danger">Прошлый снимок отклонён: {face.comment}. Сделайте новый.</motion.p>}
            {TIPS.map(({ icon: Icon, title, text }) => (
              <motion.div key={title} variants={fadeUp} className="flex gap-4 rounded-xl bg-card p-4 shadow-card">
                <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-brand-deep text-white"><span aria-hidden className="absolute inset-0 bg-sheen" /><Icon className="relative size-5" /></span>
                <span className="min-w-0"><span className="block font-medium">{title}</span><span className="block text-pretty text-sm text-muted-foreground">{text}</span></span>
              </motion.div>
            ))}
            <motion.p variants={fadeUp} className="px-1 text-pretty text-xs text-muted-foreground">Снимок увидит только служба безопасности объекта, чтобы подтвердить, что это вы. Видео не сохраняется — отправляется один кадр и оценка живости.</motion.p>
            <motion.div variants={fadeUp}><Button variant="brand" size="lg" block className="h-14 rounded-lg" onClick={() => setStep("camera")}><ScanFace />Начать</Button></motion.div>
          </motion.div>
        )}

        {(step === "camera" || step === "scan") && (
          <motion.div key="cam" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, transition: tween.exit }} transition={{ ...spring.soft, opacity: tween.base }}
            className="flex flex-col items-center gap-6 pt-2">
            <div className="relative mx-3 aspect-square w-full max-w-72">
              <Ring run={step === "scan"} />
              <div className="relative size-full overflow-hidden rounded-full bg-surface shadow-pop">
                <video ref={cam.videoRef} playsInline muted className="size-full -scale-x-100 object-cover" />
                {cam.state !== "on" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
                    {cam.state === "starting" || cam.state === "idle" ? <><Spinner />Включаем камеру…</> : <><ScanFace className="size-8" />{cam.state === "denied" ? "Доступ к камере запрещён" : "Камера недоступна"}</>}
                  </div>
                )}
              </div>
            </div>
            <div className="flex min-h-14 flex-col items-center text-center">
              <AnimatePresence mode="wait">
                <motion.p key={step === "scan" ? prompt : "ready"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: tween.exit }} transition={{ ...spring.soft, opacity: tween.fast }}
                  className="font-display text-2xl font-semibold tracking-display">{step === "scan" ? PROMPTS[prompt] : "Лицо в круге"}</motion.p>
              </AnimatePresence>
              <p className="text-sm text-muted-foreground">{step === "scan" ? "Медленно, без резких движений" : "Держите телефон на уровне глаз"}</p>
            </div>
            <div className="grid w-full max-w-sm gap-2">
              <Button variant="brand" size="lg" block className="h-14 rounded-lg" disabled={cam.state !== "on" || step === "scan"} onClick={scan}>{step === "scan" ? <><Spinner />Сканируем…</> : <><ScanFace />Сканировать</>}</Button>
              {noCam && <Button variant="secondary" block onClick={() => file.current?.click()}><Upload />Загрузить селфи</Button>}
              <input ref={file} type="file" accept="image/*" capture="user" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) fromFile(f); }} />
            </div>
          </motion.div>
        )}

        {(step === "review" || step === "sending") && shot && (
          <motion.div key="review" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, transition: tween.exit }} transition={{ ...spring.soft, opacity: tween.base }}
            className="flex flex-col items-center gap-6 pt-2">
            <motion.img src={shot.photo} alt="Ваш снимок" variants={popIn} initial="hidden" animate="show" className="aspect-square w-full max-w-64 rounded-full object-cover shadow-pop ring-4 ring-card" />
            <p className="max-w-sm text-center text-pretty text-sm text-muted-foreground">Лицо видно хорошо? Снимок уйдёт службе безопасности: после подтверждения терминал начнёт узнавать вас.</p>
            <div className="grid w-full max-w-sm gap-2">
              <Button variant="brand" size="lg" block className="h-14 rounded-lg" disabled={step === "sending"} onClick={send}>{step === "sending" ? <><Spinner />Отправляем…</> : <><Check />Отправить на проверку</>}</Button>
              <Button variant="quiet" block disabled={step === "sending"} onClick={() => { setShot(null); setStep("camera"); }}><RefreshCw />Переснять</Button>
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div key="done" variants={stagger(0.08)} initial="hidden" animate="show" className="flex flex-col items-center gap-4 pt-6 text-center">
            <motion.span variants={popIn} className="relative flex size-20 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <motion.span aria-hidden className="absolute inset-0 rounded-full bg-accent" animate={{ scale: [1, 1.35], opacity: [0.7, 0] }} transition={{ duration: duration.loop, repeat: Infinity, ease: ease.out }} />
              <Clock3 className="relative size-9" />
            </motion.span>
            <motion.h2 variants={fadeUp} className="font-display text-2xl font-semibold tracking-display">Снимок на проверке</motion.h2>
            <motion.p variants={fadeUp} className="max-w-sm text-pretty text-sm text-muted-foreground">Обычно это занимает несколько минут. Пока эталон не подтверждён, на проходной с проверкой лица вас пропустит охранник.</motion.p>
            <motion.div variants={fadeUp} className="w-full max-w-sm"><Button variant="secondary" block onClick={() => nav(routes.worker)}>К пропуску</Button></motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
