import { AnimatePresence, motion } from "motion/react";
import { Skeleton, Progress, StyledQr } from "@/shared/ui";
import { spring, tween } from "@/shared/config/motion";

/** Смена кода: старый растворяется в расфокус, новый фокусируется — по очереди, без наложения. */
const qrSwap = {
  hidden: { opacity: 0, scale: 1.06, filter: "blur(10px)" },
  show: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { ...spring.soft, opacity: tween.base, filter: tween.base } },
  exit: { opacity: 0, scale: 0.94, filter: "blur(10px)", transition: tween.exit },
};
import { usePassQr } from "../model/usePassQr";

/** QR пропуска с полосой отсчёта: при смене кода полоса возвращается пружиной, код растворяется и фокусируется заново. */
export const PassQr = ({ slot = "phone" }: { slot?: string }) => {
  const { qr, left, progress } = usePassQr(slot);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Старый и новый код лежат в одной grid-ячейке: размер плашки не меняется, центр не сбивается. */}
      <div className="grid w-full max-w-72 rounded-xl bg-white p-4 shadow-card ring-1 ring-border">
        <AnimatePresence initial={false} mode="wait">
          {qr ? (
            <motion.div key={qr.window} variants={qrSwap} initial="hidden" animate="show" exit="exit" className="col-start-1 row-start-1 w-full self-start">
              <StyledQr value={qr.value} label="QR-код пропуска" className="w-full" />
            </motion.div>
          ) : <Skeleton key="sk" className="col-start-1 row-start-1 aspect-square w-full rounded-sm" />}
        </AnimatePresence>
      </div>
      <div className="flex w-full max-w-72 flex-col gap-2">
        <Progress value={progress} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Новый код через <span className="font-medium tabular-nums text-foreground">{Math.ceil(left)} с</span></span>
          <span>без сети</span>
        </div>
      </div>
    </div>
  );
};
