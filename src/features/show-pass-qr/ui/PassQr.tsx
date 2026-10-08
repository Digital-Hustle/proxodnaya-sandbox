import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { RingTimer, Skeleton } from "@/shared/ui";
import { tween } from "@/shared/config/motion";
import { usePassQr } from "../model/usePassQr";

export const PassQr = ({ slot = "phone", size = 300 }: { slot?: string; size?: number }) => {
  const { qr, left, progress } = usePassQr(slot);
  const inner = Math.round(size * 0.62);
  return (
    <div className="flex flex-col items-center gap-4">
      <RingTimer progress={progress} size={size} stroke={12}>
        <div className="rounded-lg bg-white p-3 shadow-card">
          <AnimatePresence mode="popLayout">
            {qr ? (
              <motion.div key={qr.window} initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 1.04 }} transition={tween.base}>
                <QRCodeSVG value={qr.value} size={inner} level="M" marginSize={0} />
              </motion.div>
            ) : <Skeleton className="size-48" />}
          </AnimatePresence>
        </div>
      </RingTimer>
      <div className="text-sm tabular-nums text-muted-foreground">Новый код через {Math.ceil(left)} с · работает без интернета</div>
    </div>
  );
};
