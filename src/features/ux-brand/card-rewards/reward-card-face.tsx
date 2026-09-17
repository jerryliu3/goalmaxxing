import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";
import { CardSolidBody } from "../card-materials/card-solid-body";

export function RewardCardFace({ fields, earned, solid = true }: {
  fields: GoalCreationFields;
  earned: boolean;
  solid?: boolean;
}) {
  const ongoing = fields.target_basis === "period";
  return <>
    {solid && <CardSolidBody />}
    <TempoGoalCard fields={fields} context={earned ? "history" : "creation"} achieved={earned && !ongoing} />
  </>;
}
