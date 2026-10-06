"use client";

import { Infinity as InfinityIcon } from "lucide-react";
import { memo, useMemo, type ReactNode } from "react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { goalCardFields } from "@/features/goals/goal-card-fields";
import { goalCardProgress } from "@/features/goals/goal-card-progress";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { Goal } from "@/lib/goals/types";
import { cn } from "@/lib/utils";
import { dateLabel } from "./goal-view-model";
import { useGoalCardInteraction } from "@/features/goals/use-goal-card-interaction";

const renderFlatLettering = (text: ReactNode) => text;

function goalStatusLabel(
  model: ReturnType<typeof goalCardProgress> | null,
  progress: ProgressContextSummary | undefined
) {
  if (!model) return null;
  if (model.achieved) return "Goal accomplished";
  return progress?.lifecycle === "upcoming" ? `Starts soon · ${model.label}` : model.label;
}

function goalEndLabel(goal: Goal) {
  return goal.end_date
    ? `Ends ${dateLabel(goal.end_date, "MMM d, yyyy")}`
    : "Ongoing · no end date";
}

/** The production material goal card with its progress line and end date. */
export const GoalViewCard = memo(function GoalViewCard({
  goal,
  progress,
  fullRender = false,
  moving = false,
  compact = false,
}: {
  goal: Goal;
  progress: ProgressContextSummary | undefined;
  fullRender?: boolean;
  moving?: boolean;
  /** Card only, sized by its container; the caption becomes its tooltip. */
  compact?: boolean;
}) {
  // A compact card is a thumbnail: always the flat face, never a rotation target.
  const { ref, interactive, interactionProps } = useGoalCardInteraction({
    fullRender,
    moving: moving || compact,
  });
  const fields = useMemo(() => goalCardFields(goal), [goal]);
  const model = useMemo(() => progress ? goalCardProgress(goal, progress) : null, [goal, progress]);
  const statusLabel = goalStatusLabel(model, progress);
  return (
    <div
      ref={ref}
      className={cn("mx-auto w-full", !compact && "max-w-[244px]")}
      data-goal-view-card={goal.id}
      title={compact ? [statusLabel, goalEndLabel(goal)].filter(Boolean).join(" · ") : undefined}
      {...(compact ? {} : interactionProps)}
    >
      <TempoGoalCard
        fields={fields}
        context="history"
        achieved={model?.achieved ?? false}
        assembly={model?.assembly}
        flat={Boolean(model?.assembly) && !interactive}
        rotatable={interactive}
        // Each shard repeats the face. Keep readable type, without multiplying
        // sixteen decorative glyph walls across every fragment during a tilt.
        renderLettering={renderFlatLettering}
      />
      {compact ? null : (
        <div className="mt-3 space-y-1 text-center text-xs text-muted-foreground">
          {statusLabel ? (
            <p className="font-mono" role="status">
              {statusLabel}
            </p>
          ) : null}
          <p className="flex items-center justify-center gap-1">
            {goal.end_date ? null : <InfinityIcon size={14} aria-hidden />}
            {goalEndLabel(goal)}
          </p>
        </div>
      )}
    </div>
  );
});
