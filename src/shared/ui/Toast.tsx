import { AnimatePresence, motion } from "motion/react";
import { create } from "zustand";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { spring } from "@/shared/config/motion";
import { motion as m } from "@/shared/config/tokens";
import { cn } from "@/shared/lib";

type Toast = { id: number; text: string; tone: "success" | "error" | "info" };
const useToasts = create<{ list: Toast[]; push: (t: Omit<Toast, "id">) => void; drop: (id: number) => void }>((set) => ({
  list: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ list: [...s.list.slice(-2), { ...t, id }] }));
    setTimeout(() => set((s) => ({ list: s.list.filter((x) => x.id !== id) })), t.tone === "error" ? m.toast.errorDurationMs : m.toast.durationMs);
  },
  drop: (id) => set((s) => ({ list: s.list.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (text: string) => useToasts.getState().push({ text, tone: "success" }),
  error: (text: string) => useToasts.getState().push({ text, tone: "error" }),
  info: (text: string) => useToasts.getState().push({ text, tone: "info" }),
};

const ICON = { success: CheckCircle2, error: AlertTriangle, info: Info };

export const Toaster = () => {
  const { list, drop } = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-toast flex flex-col items-center gap-2 p-4 pt-safe">
      <AnimatePresence>
        {list.map((t) => {
          const Icon = ICON[t.tone];
          return (
            <motion.button key={t.id} layout onClick={() => drop(t.id)} initial={{ y: -24, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -12, opacity: 0 }} transition={spring.snappy}
              className="pointer-events-auto flex max-w-md items-center gap-3 rounded-lg bg-popover px-4 py-3 text-left text-sm text-popover-foreground shadow-pop">
              <Icon className={cn("size-5 shrink-0", t.tone === "success" ? "text-brand" : t.tone === "error" ? "text-destructive" : "text-info")} />
              {t.text}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
