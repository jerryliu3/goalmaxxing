"use client";

import { Link2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import type { ChecklistGoalPresentation } from "@/lib/goals/checklist-presentation";
import { projectChecklistGoalPresentation } from "@/lib/goals/checklist-presentation";
import { getCategoryBadgeClass, getGoalCategoryLabel } from "@/lib/goals/category";
import type { GoalProgressSnapshot } from "@/lib/goals/progress";
import { getFrequencySummary } from "@/lib/goals/schedule";
import { createChecklistTemporalContext } from "@/lib/goals/period-domain";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: Goal;
  completions: CompletionDateFact[];
  progress?: GoalProgressSnapshot;
  presentation?: ChecklistGoalPresentation;
  linkedCount: number;
  imageUrl?: string;
  selectedDate: string;
  disabled?: boolean;
  archived?: boolean;
}
type GoalCardInteractionProps =
  | {
      readOnly: true;
      onToggle?: never;
    }
  | {
      readOnly?: false;
      onToggle: (sourceElement: HTMLButtonElement) => void | PromiseLike<void>;
    };

export function GoalCard({
  goal,
  completions,
  progress,
  presentation,
  linkedCount,
  imageUrl,
  selectedDate,
  disabled = false,
  archived = false,
  readOnly = false,
  onToggle,
}: GoalCardProps & GoalCardInteractionProps) {
  const resolvedPresentation =
    presentation ??
    projectChecklistGoalPresentation({
      goal,
      completions,
      progress,
      temporal: createChecklistTemporalContext({
        selectedDate,
        asOfDate: selectedDate,
      }),
    });
  const goalCategoryLabel = getGoalCategoryLabel(
    goal.category,
    goal.category_key
  );
  const hasNoEndDate = goal.end_date === null;

  const body = (
    <>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={goal.title}
          width={48}
          height={48}
          unoptimized
          className="size-12 rounded-lg object-cover ring-1 ring-border"
        />
      ) : null}

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`h-5 shrink-0 rounded-md px-1.5 text-[11px] font-semibold ${getCategoryBadgeClass(
              goal.category_key ?? goal.category
            )}`}
          >
            {goalCategoryLabel}
          </Badge>
          <h3 className="truncate type-item text-sm">{goal.title}</h3>
          {hasNoEndDate ? (
            <Badge variant="outline" className="h-4 px-1 text-[10px]">
              No end date
            </Badge>
          ) : null}
          {progress?.outcome === "ended_with_shortfall" ? (
            <Badge variant="outline">Shortfall</Badge>
          ) : null}
        </div>
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <p className="truncate">
            {getFrequencySummary(goal, resolvedPresentation.displayCompletionCount, {
              periodScopedCount: resolvedPresentation.periodCompletionCount !== null,
            })}
          </p>
          {linkedCount > 0 ? (
            <span
              className="inline-flex shrink-0 items-center gap-1"
              aria-label={`${linkedCount} linked goals`}
            >
              <Link2 className="size-3" />
              {`Linked ${linkedCount}`}
            </span>
          ) : null}
          {resolvedPresentation.completionSourceForSelectedDate ===
          "linked_cascade" ? (
            <Badge variant="outline" className="h-4 px-1 text-[10px]">
              Auto-completed
            </Badge>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <Card
      className={cn(
        "shadow-sm",
        resolvedPresentation.isGreen &&
          "border-primary/30 bg-primary/10"
      )}
    >
      <CardContent className="flex items-center gap-2 px-2 py-0.5">
        {readOnly ? (
          <span
            aria-hidden
            className={`size-4 shrink-0 rounded-full border ${
              resolvedPresentation.exactDateCompleted
                ? "border-primary bg-primary"
                : "border-muted-foreground/40 bg-transparent"
            }`}
          />
        ) : (
          <CompletionToggle
            completed={resolvedPresentation.exactDateCompleted}
            pending={disabled && !archived}
            size="lg"
            onClick={(event) => onToggle?.(event.currentTarget)}
            disabled={disabled || archived}
            aria-label={
              resolvedPresentation.exactDateCompleted
                ? `Remove completion for ${selectedDate}`
                : `Complete goal for ${selectedDate}`
            }
          />
        )}

        {readOnly ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-0.5 py-0.5">
            {body}
          </div>
        ) : (
          <Link
            href={`/goals/${goal.id}`}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-0.5 py-0.5 transition-colors hover:bg-muted/40"
          >
            {body}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
