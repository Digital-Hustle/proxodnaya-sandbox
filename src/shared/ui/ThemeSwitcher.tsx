import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Segmented } from "./Segmented";

type Mode = "light" | "dark" | "system";
const KEY = "proxodnaya.theme";
const read = (): Mode => (localStorage.getItem(KEY) as Mode) || "system";
const resolve = (m: Mode) => m === "dark" || (m === "system" && matchMedia("(prefers-color-scheme: dark)").matches);

/** Применить сохранённую тему (дублирует no-flash скрипт в index.html — на случай SPA-переходов). */
export const applyStoredTheme = () => document.documentElement.classList.toggle("dark", resolve(read()));

/** Режим темы с сохранением и подпиской на системную. */
export const useThemeMode = () => {
  const [mode, setMode] = useState<Mode>(read);
  useEffect(() => {
    localStorage.setItem(KEY, mode);
    applyStoredTheme();
    if (mode !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", applyStoredTheme);
    return () => mq.removeEventListener("change", applyStoredTheme);
  }, [mode]);
  return [mode, setMode] as const;
};

export type ThemeMode = Mode;

export const ThemeSwitcher = ({ className }: { className?: string }) => {
  const [mode, setMode] = useThemeMode();
  return (
    <Segmented size="sm" value={mode} onChange={setMode} label="Тема" className={className}
      options={[
        { value: "light", label: <span className="sr-only">Светлая</span>, icon: <Sun />, title: "Светлая" },
        { value: "dark", label: <span className="sr-only">Тёмная</span>, icon: <Moon />, title: "Тёмная" },
        { value: "system", label: <span className="sr-only">Как в системе</span>, icon: <Monitor />, title: "Как в системе" },
      ]} />
  );
};
