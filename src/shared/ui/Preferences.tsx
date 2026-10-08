import { useState } from "react";
import { motion } from "motion/react";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { cn } from "@/shared/lib";
import { press, popIn } from "@/shared/config/motion";
import { Dialog } from "./Dialog";
import { useThemeMode, type ThemeMode } from "./ThemeSwitcher";

const MODES: { value: ThemeMode; label: string; icon: typeof Sun; preview: string }[] = [
  { value: "light", label: "Светлая", icon: Sun, preview: "bg-page" },
  { value: "dark", label: "Тёмная", icon: Moon, preview: "dark bg-page" },
  { value: "system", label: "Как в системе", icon: Monitor, preview: "bg-brand-conic" },
];

/** Выбор темы карточками-превью. Живёт в «Оформлении», а не в шапке. */
export const ThemePicker = ({ className }: { className?: string }) => {
  const [mode, setMode] = useThemeMode();
  return (
    <div role="radiogroup" aria-label="Тема" className={cn("grid grid-cols-3 gap-2 sm:gap-3", className)}>
      {MODES.map(({ value, label, icon: Icon, preview }) => {
        const on = mode === value;
        return (
          <motion.button key={value} type="button" role="radio" aria-checked={on} {...press} onClick={() => setMode(value)}
            className={cn("relative flex flex-col gap-2 rounded-lg p-1.5 pb-3 text-left outline-none ring-2 transition-colors duration-fast focus-visible:ring-ring", on ? "bg-accent ring-brand" : "bg-muted ring-transparent hover:bg-surface")}>
            <span className={cn("relative flex h-16 items-end overflow-hidden rounded-md p-2", preview)}>
              <span className="h-5 w-3/4 rounded-xs bg-card shadow-xs" />
              {on && (
                <motion.span variants={popIn} initial="hidden" animate="show" className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" strokeWidth={3} />
                </motion.span>
              )}
            </span>
            <span className="flex items-center gap-1.5 px-1.5 text-sm font-medium"><Icon className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{label}</span></span>
          </motion.button>
        );
      })}
    </div>
  );
};

/** Кнопка «Оформление» для шапки: открывает шторку/модалку с выбором темы и доп. содержимым. */
export const PreferencesButton = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button type="button" {...press} onClick={() => setOpen(true)} aria-label="Оформление" title="Оформление"
        className={cn("flex size-control-md shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors duration-fast hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring", className)}>
        <Palette className="size-5" />
      </motion.button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Оформление" description="Настройка сохраняется на этом устройстве. Киоск всегда в тёмной теме.">
        <ThemePicker />
        {children}
      </Dialog>
    </>
  );
};
