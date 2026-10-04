"use client";

import { Infinity as InfinityIcon } from "lucide-react";
import { memo, useMemo } from "react";
import { useReducedMotion } from "motion/react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { goalCardFields } from "@/features/goals/goal-card-fields";
import { goalCardProgress } from "@/features/goals/goal-card-progress";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { Goal } from "@/lib/goals/types";
import { dateLabel } from "./goal-view-model";
import { useGoalCardVisibility } from "./use-goal-card-visibility";

/** The production material goal card with its progress line and end date. */
export const GoalViewCard = memo(function GoalViewCard({
  goal,
  progress,
}: {
  goal: Goal;
  progress: ProgressContextSummary | undefined;
}) {
  const { ref, nearViewport } = useGoalCardVisibility();
  const reducedMotion = useReducedMotion();
  const interactive = nearViewport && !reducedMotion;
  const fields = useMemo(() => goalCardFields(goal), [goal]);
  const model = useMemo(() => progress ? goalCardProgress(goal, progress) : null, [goal, progress]);
  const statusLabel = !model
    ? null
    : model.achieved
      ? "Goal accomplished"
      : progress?.lifecycle === "upcoming"
        ? `Starts soon · ${model.label}`
        : model.label;
  return (
    <div ref={ref} className="mx-auto w-full max-w-[244px]" data-goal-view-card={goal.id}>
      <TempoGoalCard
        fields={fields}
        context="history"
        achieved={model?.achieved ?? false}
        assembly={model?.assembly}
        flat={Boolean(model?.assembly) && !interactive}
        rotatable={interactive}
      />
      <div className="mt-3 space-y-1 text-center text-xs text-muted-foreground">
        {statusLabel ? (
          <p className="font-mono" role="status">
            {statusLabel}
          </p>
        ) : null}
        <p className="flex items-center justify-center gap-1">
          {goal.end_date ? (
            <>Ends {dateLabel(goal.end_date, "MMM d, yyyy")}</>
          ) : (
            <>
              <InfinityIcon size={14} aria-hidden />
              Ongoing · no end date
            </>
          )}
        </p>
      </div>
    </div>
  );
});
