"use client";

import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import { goalCardFields } from "./goal-card-fields";
import { goalCardProgress } from "./goal-card-progress";
import { getRewardProgress } from "./card-material/reassembly-progress";
import { TempoGoalCard } from "./tempo-goal-card";
import { MilestonePills } from "./milestone-pills";

export function GoalProgressCard({
  goal,
  progress,
  gallery = false,
  showMilestones = true,
}: {
  goal: Goal;
  progress: ProgressContextSummary;
  gallery?: boolean;
  showMilestones?: boolean;
}) {
  const model = goalCardProgress(goal, progress);
  const assembly = model.assembly;
  const sharded =
    assembly != null && !getRewardProgress(assembly.completed, assembly.target).earned;
  return <div className="min-w-0" data-goal-progress-card={goal.id}>
    <TempoGoalCard
      key={goal.id}
      fields={goalCardFields(goal)}
      context="history"
      achieved={model.achieved}
      assembly={assembly}
      rotatable={!gallery || !sharded}
      flat={gallery && sharded}
    />
    <p className="mt-5 text-center font-mono text-xs text-muted-foreground" role="status" aria-live="polite">
      {model.achieved ? "Goal accomplished" : progress.lifecycle === "upcoming" ? "Starts soon · " + model.label : model.label}
    </p>
    {goal.reward_text?.trim() && <p className="mt-2 text-center text-sm text-foreground">
      <span className="text-muted-foreground">{model.achieved ? "Earned · " : "Reward · "}</span>{goal.reward_text}
    </p>}
    {showMilestones && !gallery && goal.frequency_type === "fixed_milestones" && <div className="mt-4">
      <MilestonePills targetCount={goal.target_count ?? 1} completionDates={progress.milestoneDates} milestoneNames={goal.milestone_names ?? []} maxVisible={3} />
    </div>}
  </div>;
}
