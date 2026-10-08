import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/shared/lib";
import { spring, tween } from "@/shared/config/motion";

/** Модалка на десктопе и нижняя шторка на телефоне. */
export const Dialog = ({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; className?: string }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-modal flex items-end justify-center sm:items-center sm:p-6">
          <motion.div className="absolute inset-0 bg-overlay backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={tween.base} onClick={onClose} />
          <motion.div role="dialog" aria-modal aria-label={title}
            initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0, scale: 0.98 }} transition={spring.sheet}
            className={cn("relative max-h-full w-full overflow-auto rounded-t-xl bg-popover p-6 pb-safe text-popover-foreground shadow-pop sm:max-w-lg sm:rounded-xl", className)}>
            <div className="mb-4 flex items-center justify-between gap-4">
              {title && <h2 className="font-display text-xl font-semibold">{title}</h2>}
              <button onClick={onClose} aria-label="Закрыть" className="ml-auto flex size-control-xs items-center justify-center rounded-full text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
