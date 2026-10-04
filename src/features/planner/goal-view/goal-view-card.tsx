"use client";

import { Infinity as InfinityIcon } from "lucide-react";
import { memo, useMemo } from "react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { goalCardFields } from "@/features/goals/goal-card-fields";
import { goalCardProgress } from "@/features/goals/goal-card-progress";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { Goal } from "@/lib/goals/types";
import { dateLabel } from "./goal-view-model";

/** The production material goal card with its progress line and end date. */
export const GoalViewCard = memo(function GoalViewCard({
  goal,
  progress,
  interactive = true,
}: {
  goal: Goal;
  progress: ProgressContextSummary | undefined;
  /** Swipe hosts enable rotation only while the user is turning this card. */
  interactive?: boolean;
}) {
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
    <div className="mx-auto w-full max-w-[244px]" data-goal-view-card={goal.id}>
      {/* Reuse the gallery's single clipped face; the whole card can still turn. */}
      <TempoGoalCard
        fields={fields}
        context="history"
        achieved={model?.achieved ?? false}
        assembly={model?.assembly}
        flat={Boolean(model?.assembly)}
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
