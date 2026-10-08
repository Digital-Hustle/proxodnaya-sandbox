import { useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { installState, promptInstall } from "@/shared/lib";
import { Button } from "./Button";

/** Кнопка «Установить»: видна, только когда браузер готов поставить приложение на экран устройства. */
export const InstallButton = ({ label = "Установить", className }: { label?: string; className?: string }) => {
  const can = useSyncExternalStore(installState.subscribe, installState.canInstall, () => false);
  if (!can || installState.installed()) return null;
  return <Button variant="secondary" size="sm" className={className} onClick={() => promptInstall()}><Download />{label}</Button>;
};
