import { useNavigate, useSearchParams, Link } from "react-router";
import { motion } from "motion/react";
import { Logo, ThemeSwitcher } from "@/shared/ui";
import { ActivateForm } from "@/features/activate-device";
import { routes } from "@/shared/const/router";
import { fadeUp } from "@/shared/config/motion";

export const WorkerActivatePage = () => {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-120 bg-glow" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-safe">
        <header className="flex h-16 items-center justify-between gap-3"><Link to={routes.home} className="min-w-0"><Logo sub="пропуск" /></Link><ThemeSwitcher /></header>
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="my-auto rounded-xl bg-card px-5 py-8 shadow-float sm:px-8">
          <ActivateForm initialCode={sp.get("c") ?? ""} payload={sp.get("p") ?? undefined} onDone={() => nav(routes.worker, { replace: true })} />
        </motion.div>
        <p className="mx-auto max-w-xs py-6 text-center text-xs text-muted-foreground">Пароль не нужен: телефон получает собственный ключ, который нельзя скопировать.</p>
      </div>
    </div>
  );
};
