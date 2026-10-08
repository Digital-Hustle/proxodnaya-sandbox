import { useEffect, useId, useState } from "react";
import { NavLink } from "react-router";
import { motion } from "motion/react";
import { cn } from "@/shared/lib";
import { spring, motionTokens } from "@/shared/config/motion";

/**
 * Шапка как на sberbank.ru: белая пилюля 60 px с внутренним отступом 6 px, висит над мятным фоном.
 * Липнет с зазором сверху (без полос под вырезом), при прокрутке получает тень и чуть поджимается пружиной.
 */
export const HeaderBar = ({ children, className, inner }: { children: React.ReactNode; className?: string; inner?: string }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(scrollY > motionTokens.header.shrinkAt);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cn("pointer-events-none sticky top-0 z-nav px-2 pt-safe sm:px-6", className)}>
      <motion.div animate={{ y: scrolled ? -2 : 0, scale: scrolled ? 0.99 : 1 }} transition={spring.snappy}
        className={cn("pointer-events-auto mx-auto mt-2 flex h-15 max-w-7xl items-center gap-2 rounded-lg bg-card/90 p-1.5 backdrop-blur-xl transition-shadow duration-base sm:mt-3 sm:gap-3", scrolled ? "shadow-float" : "shadow-card", inner)}>
        {children}
      </motion.div>
    </header>
  );
};

export type NavItem = { to: string; label: React.ReactNode; end?: boolean; icon?: React.ReactNode };

/** Дорожка разделов в шапке: мятный градиент + белая «пилюля» активного, перепрыгивает пружиной. */
export const NavTrack = ({ items, className, label = "Разделы" }: { items: NavItem[]; className?: string; label?: string }) => {
  const id = useId();
  return (
    <nav aria-label={label} className={cn("scrollbar-none min-w-0 overflow-x-auto rounded-md bg-track p-1", className)}>
      <div className="flex w-max">
        {items.map(({ to, label, end, icon }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn("relative flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-sm px-3.5 text-sm font-medium outline-none transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-ring xl:px-4 [&_svg]:size-4",
              isActive ? "text-foreground" : "text-foreground/70 hover:text-foreground")}>
            {({ isActive }) => (<>
              {isActive && <motion.span layoutId={`track-${id}`} transition={spring.snappy} className="absolute inset-0 rounded-sm bg-card shadow-xs dark:bg-border-strong" />}
              <span className="relative z-raised flex items-center gap-2">{icon}{label}</span>
            </>)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
