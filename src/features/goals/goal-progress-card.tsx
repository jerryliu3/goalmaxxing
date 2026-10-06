"use client";

import { memo, useMemo, type ReactNode } from "react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import { goalCardFields } from "./goal-card-fields";
import { goalCardProgress } from "./goal-card-progress";
import { TempoGoalCard } from "./tempo-goal-card";
import { useGoalCardInteraction } from "./use-goal-card-interaction";

const renderFlatLettering = (text: ReactNode) => text;

export const GoalProgressCard = memo(function GoalProgressCard({
  goal,
  progress,
  gallery = false,
  moving = false,
}: {
  goal: Goal;
  progress: ProgressContextSummary;
  gallery?: boolean;
  moving?: boolean;
}) {
  const { ref, interactive, interactionProps } = useGoalCardInteraction({ preload: gallery, fullRender: !gallery, moving });
  const model = useMemo(() => goalCardProgress(goal, progress), [goal, progress]);
  const fields = useMemo(() => goalCardFields(goal), [goal]);
  return <div ref={ref} className="min-w-0" data-goal-progress-card={goal.id} {...interactionProps}>
    <TempoGoalCard
      key={goal.id}
      fields={fields}
      context="history"
      achieved={model.achieved}
      assembly={model.assembly}
      rotatable={interactive}
      flat={!interactive}
      renderLettering={gallery ? renderFlatLettering : undefined}
    />
    <p className="mt-5 text-center type-figure text-xs text-muted-foreground" role="status" aria-live="polite">
      {model.achieved ? "Goal accomplished" : progress.lifecycle === "upcoming" ? "Starts soon · " + model.label : model.label}
    </p>
    {goal.reward_text?.trim() && <p className="mt-2 text-center text-sm text-foreground">
      <span className="text-muted-foreground">{model.achieved ? "Earned · " : "Reward · "}</span>{goal.reward_text}
    </p>}
  </div>;
});
