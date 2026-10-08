import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { REASONS, type Attempt } from "@/shared/api";
import { hhmm, dateRu, cn } from "@/shared/lib";
import { DecisionBadge } from "./DecisionBadge";

/** Строка журнала: время, направление, решение, причина. who — слот для сотрудника (рисует слой выше). */
export const AttemptRow = ({ a, who, showDate, className }: { a: Attempt; who?: React.ReactNode; showDate?: boolean; className?: string }) => (
  <div className={cn("flex items-center gap-3 py-3", className)}>
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", a.direction === "IN" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground")}>
      {a.direction === "IN" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
    </span>
    <div className="min-w-0 flex-1">
      {who}
      <div className="truncate text-sm text-muted-foreground">{a.decision === "ALLOW" || a.code === "OK" ? (a.direction === "IN" ? "Вход" : "Выход") : REASONS[a.code].message}{a.note ? ` · ${a.note}` : ""}</div>
    </div>
    <div className="flex shrink-0 flex-col items-end gap-1">
      <DecisionBadge decision={a.decision} />
      <span className="text-xs tabular-nums text-muted-foreground">{showDate ? `${dateRu(a.ts)}, ` : ""}{hhmm(a.ts)}</span>
    </div>
  </div>
);
