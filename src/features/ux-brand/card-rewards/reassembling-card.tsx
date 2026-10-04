"use client";

import type { GoalCreationFields } from "@/lib/goals/creation-model";
import { ReassemblingCard as CardAssembly } from "@/features/goals/card-material/reassembling-card";
import { RewardCardFace } from "./reward-card-face";
import { getRewardProgress } from "./reward-model";

export function ReassemblingCard({ fields, completed, target, still }: {
  fields: GoalCreationFields; completed: number; target: number; still: boolean;
}) {
  return <CardAssembly key={target} completed={completed} target={target} still={still}>
    <RewardCardFace fields={fields} earned={getRewardProgress(completed, target).earned} solid={false} />
  </CardAssembly>;
}
