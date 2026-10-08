import { AnimatePresence, motion } from "motion/react";
import { WifiOff } from "lucide-react";
import { useOnline } from "@/shared/hooks";
import { tween } from "@/shared/config/motion";

export const OfflineBanner = ({ text = "Нет связи — показываем сохранённые данные" }: { text?: string }) => {
  const online = useOnline();
  return (
    <AnimatePresence>
      {!online && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={tween.base}
          className="overflow-hidden bg-warning text-warning-foreground">
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"><WifiOff className="size-4" />{text}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
