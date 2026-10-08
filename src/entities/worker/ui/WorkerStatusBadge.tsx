import { Badge } from "@/shared/ui";
import type { Worker } from "@/shared/api";
import { todayKey } from "@/shared/lib";

export const WorkerStatusBadge = ({ w, inside }: { w: Worker; inside?: boolean }) => {
  if (w.status === "blocked") return <Badge tone="danger">Заблокирован</Badge>;
  if (w.permitUntil < todayKey()) return <Badge tone="warning">Допуск просрочен</Badge>;
  if (inside) return <Badge tone="success">На объекте</Badge>;
  return <Badge>Не на объекте</Badge>;
};
