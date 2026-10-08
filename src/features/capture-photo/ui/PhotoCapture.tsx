import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, RefreshCw, Upload } from "lucide-react";
import { useCamera } from "@/shared/hooks";
import { Button } from "@/shared/ui";
import { tween } from "@/shared/config/motion";

const fileToDataUrl = (f: File, maxSide = 320) => new Promise<string>((resolve) => {
  const img = new Image();
  img.onload = () => {
    const k = maxSide / Math.max(img.width, img.height);
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    resolve(c.toDataURL("image/jpeg", 0.8));
  };
  img.src = URL.createObjectURL(f);
});

/** Фото сотрудника с вебкамеры (или файлом). Хранится уменьшенным — в песочнице это localStorage. */
export const PhotoCapture = ({ value, onChange }: { value?: string; onChange: (dataUrl?: string) => void }) => {
  const cam = useCamera("user");
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!value) cam.start(); else cam.stop(); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full max-w-xs self-center overflow-hidden rounded-xl bg-muted">
        <video ref={cam.videoRef} playsInline muted className="size-full -scale-x-100 object-cover" />
        <AnimatePresence>
          {value && <motion.img key="shot" src={value} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={tween.base} className="absolute inset-0 size-full object-cover" alt="Фото сотрудника" />}
        </AnimatePresence>
        {!value && cam.state !== "on" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <Camera className="size-8" />
            {cam.state === "starting" ? "Включаем камеру…" : cam.state === "denied" ? "Доступ к камере запрещён — загрузите фото файлом" : "Камера недоступна — загрузите фото файлом"}
          </div>
        )}
        {!value && cam.state === "on" && <div className="pointer-events-none absolute inset-8 rounded-full border-2 border-dashed border-white/70" />}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {value ? (
          <Button variant="outline" onClick={() => onChange(undefined)}><RefreshCw />Переснять</Button>
        ) : (
          <Button disabled={cam.state !== "on"} onClick={() => onChange(cam.snapshot() ?? undefined)}><Camera />Сделать фото</Button>
        )}
        <Button variant="ghost" onClick={() => file.current?.click()}><Upload />Файл</Button>
        <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) onChange(await fileToDataUrl(f)); }} />
      </div>
    </div>
  );
};
