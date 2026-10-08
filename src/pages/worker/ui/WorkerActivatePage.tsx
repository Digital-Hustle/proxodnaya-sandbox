import { useNavigate, useSearchParams, Link } from "react-router";
import { Aurora, Logo } from "@/shared/ui";
import { ActivateForm } from "@/features/activate-device";
import { routes } from "@/shared/const/router";

export const WorkerActivatePage = () => {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <Aurora intensity={0.45} />
      <div className="absolute inset-0 bg-background/50" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-safe">
        <header className="py-5"><Link to={routes.home}><Logo /></Link></header>
        <div className="my-auto rounded-2xl bg-card/90 p-6 shadow-card backdrop-blur-md">
          <ActivateForm initialCode={sp.get("c") ?? ""} payload={sp.get("p") ?? undefined} onDone={() => nav(routes.worker, { replace: true })} />
        </div>
        <p className="py-6 text-center text-xs text-muted-foreground">Пароль не нужен: телефон получает собственный ключ, который нельзя скопировать.</p>
      </div>
    </div>
  );
};
