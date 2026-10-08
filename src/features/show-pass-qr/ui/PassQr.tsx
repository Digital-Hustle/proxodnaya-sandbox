import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { Skeleton, Progress } from "@/shared/ui";
import { popIn } from "@/shared/config/motion";
import { usePassQr } from "../model/usePassQr";

/** QR пропуска с полосой отсчёта: при смене кода полоса возвращается пружиной, код «впрыгивает». */
export const PassQr = ({ slot = "phone" }: { slot?: string }) => {
  const { qr, left, progress } = usePassQr(slot);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative aspect-square w-full max-w-64 rounded-lg bg-white p-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {qr ? (
            <motion.div key={qr.window} variants={popIn} initial="hidden" animate="show" exit="exit" className="size-full">
              <QRCodeSVG value={qr.value} size={256} level="M" marginSize={0} className="size-full" />
            </motion.div>
          ) : <Skeleton className="size-full rounded-sm" />}
        </AnimatePresence>
      </div>
      <div className="flex w-full max-w-64 flex-col gap-2">
        <Progress value={progress} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Новый код через <span className="font-medium tabular-nums text-foreground">{Math.ceil(left)} с</span></span>
          <span>работает без сети</span>
        </div>
      </div>
    </div>
  );
};
