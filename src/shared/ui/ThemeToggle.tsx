import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./Button";

const KEY = "proxodnaya.theme";
export const applyStoredTheme = () => document.documentElement.classList.toggle("dark", localStorage.getItem(KEY) === "dark");

export const ThemeToggle = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem(KEY, dark ? "dark" : "light"); }, [dark]);
  return <Button variant="ghost" size="icon" aria-label="Тема" onClick={() => setDark((d) => !d)}>{dark ? <Sun /> : <Moon />}</Button>;
};
