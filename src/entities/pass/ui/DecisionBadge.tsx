import { Badge } from "@/shared/ui";
import type { Decision } from "@/shared/api";
import { decisionView } from "../model/decisionView";

export const DecisionBadge = ({ decision }: { decision: Decision }) => {
  const v = decisionView[decision];
  const Icon = v.icon;
  return <Badge tone={v.tone}><Icon />{v.label}</Badge>;
};
