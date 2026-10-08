import { Status } from "@/shared/ui";
import type { Decision } from "@/shared/api";
import { decisionView } from "../model/decisionView";

export const DecisionBadge = ({ decision }: { decision: Decision }) => {
  const v = decisionView[decision];
  return <Status tone={v.tone} dot>{v.label}</Status>;
};
