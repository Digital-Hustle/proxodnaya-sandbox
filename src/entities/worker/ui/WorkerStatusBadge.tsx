import { Status } from "@/shared/ui";
import type { Worker } from "@/shared/api";
import { todayKey } from "@/shared/lib";

export const WorkerStatusBadge = ({ w, inside }: { w: Worker; inside?: boolean }) => {
  if (w.status === "blocked") return <Status tone="danger" dot>Заблокирован</Status>;
  if (w.permitUntil < todayKey()) return <Status tone="warning" dot>Допуск просрочен</Status>;
  if (inside) return <Status tone="success" dot>На объекте</Status>;
  return <Status dot>Не на объекте</Status>;
};
