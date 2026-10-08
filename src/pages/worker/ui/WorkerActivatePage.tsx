import { useNavigate, useSearchParams, Link } from "react-router";
import { motion } from "motion/react";
import { Logo, PreferencesButton, Aurora } from "@/shared/ui";
import { ActivateForm } from "@/features/activate-device";
import { routes } from "@/shared/const/router";
import { fadeUp } from "@/shared/config/motion";

export const WorkerActivatePage = () => {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <Aurora fixed intensity={0.8} />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-safe">
        <header className="mt-2 flex h-15 items-center justify-between gap-3 rounded-lg bg-card/90 p-1.5 pl-3 shadow-card backdrop-blur-xl"><Link to={routes.home} className="min-w-0"><Logo sub="пропуск" /></Link><PreferencesButton /></header>
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="my-auto rounded-2xl bg-card px-5 py-8 shadow-pop sm:px-8">
          <ActivateForm initialCode={sp.get("c") ?? ""} payload={sp.get("p") ?? undefined} onDone={() => nav(routes.worker, { replace: true })} />
        </motion.div>
        <p className="mx-auto max-w-xs py-6 text-center text-xs text-muted-foreground">Пароль не нужен: телефон получает собственный ключ, который нельзя скопировать.</p>
      </div>
    </div>
  );
};
