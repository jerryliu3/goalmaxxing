import { format, isValid, parse, parseISO } from "date-fns";
import type { ChecklistGoalPresentation } from "@/lib/goals/checklist-presentation";
import { getGoalCategoryLabel } from "@/lib/goals/category";
import {
  cadencePeriodTarget,
  isDeadlineTotalGoal,
  isPeriodCadenceGoal,
} from "@/lib/goals/target-basis";
import type { Goal, GoalDifficulty } from "@/lib/goals/types";
import { getGoalVisual } from "@/features/planner/goal-visuals";

export type WorkQuestEffort = {
  label: "light" | "steady" | "heavy";
  level: 1 | 2 | 3;
};

export interface WorkQuestModel {
  id: string;
  title: string;
  categoryLabel: string;
  color: string;
  contribution: string | null;
  sittingLabel: string;
  cadenceLabel: string | null;
  horizonLabel: string | null;
  effort: WorkQuestEffort | null;
  periodDone: number | null;
  periodTarget: number | null;
  periodScopeLabel: string | null;
  isPrivate: boolean;
  completed: boolean;
  locked: boolean;
  linked: boolean;
}

const EFFORT_BY_DIFFICULTY: Record<GoalDifficulty, WorkQuestEffort> = {
  easy: { label: "light", level: 1 },
  medium: { label: "steady", level: 2 },
  hard: { label: "heavy", level: 3 },
};

export function formatQuestSittingTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  const parsed = parse(trimmed, "HH:mm", new Date());
  if (!isValid(parsed)) {
    return trimmed;
  }
  return format(parsed, "h:mm a");
}

export function describeGoalCadence(goal: Pick<
  Goal,
  "frequency_type" | "recurrence_interval" | "target_count" | "target_basis"
>): string {
  if (goal.frequency_type === "fixed_milestones") {
    const count = goal.target_count ?? 0;
    return count === 1 ? "1 milestone" : `${count} milestones`;
  }
  if (isDeadlineTotalGoal(goal as Goal) || goal.target_basis === "lifetime") {
    const count = goal.target_count ?? 1;
    return count === 1 ? "One sitting" : `${count} times in total`;
  }
  if (goal.recurrence_interval === "daily") {
    return "Every day";
  }
  if (goal.recurrence_interval === "monthly") {
    const count = cadencePeriodTarget(goal as Goal);
    return count === 1 ? "1 day a month" : `${count} days a month`;
  }
  const count = cadencePeriodTarget(goal as Goal);
  if (count === 1) {
    return "Once a week";
  }
  return `${count} days a week`;
}

export function describeGoalHorizon(
  endDate: string | null | undefined,
  options?: { dueDate?: string | null }
): string {
  if (!endDate) {
    return "No end date";
  }
  if (options?.dueDate && endDate === options.dueDate) {
    return "Due today";
  }
  const parsed = parseISO(endDate);
  if (!isValid(parsed)) {
    return `Until ${endDate}`;
  }
  return `Until ${format(parsed, "MMM d")}`;
}

export function describeGoalEffort(
  difficulty: GoalDifficulty | null | undefined
): WorkQuestEffort | null {
  if (!difficulty) {
    return null;
  }
  return EFFORT_BY_DIFFICULTY[difficulty] ?? null;
}

export function describePeriodScope(
  goal: Pick<Goal, "frequency_type" | "recurrence_interval" | "target_basis">
): string | null {
  if (goal.frequency_type === "fixed_milestones") {
    return "milestones";
  }
  if (isDeadlineTotalGoal(goal as Goal) || goal.target_basis === "lifetime") {
    return "in total";
  }
  if (goal.recurrence_interval === "daily") {
    return "today";
  }
  if (goal.recurrence_interval === "monthly") {
    return "this month";
  }
  if (goal.recurrence_interval === "weekly") {
    return "this week";
  }
  return null;
}

export function projectWorkQuestModel({
  id,
  title,
  goal,
  category,
  color,
  sittingTime,
  unplaced = false,
  completed,
  locked = false,
  linked = false,
  presentation,
  sittingDate = null,
  endDate = null,
}: {
  id: string;
  title: string;
  goal?: Goal | null;
  category?: string | null;
  color?: string | null;
  sittingTime?: string | null;
  unplaced?: boolean;
  completed: boolean;
  locked?: boolean;
  linked?: boolean;
  presentation?: ChecklistGoalPresentation | null;
  sittingDate?: string | null;
  endDate?: string | null;
}): WorkQuestModel {
  const resolvedGoal = goal ?? null;
  const visual = getGoalVisual({
    goalId: resolvedGoal?.id ?? id,
    color: resolvedGoal?.color ?? color ?? null,
    category: resolvedGoal?.category ?? category ?? null,
  });
  const timeLabel = formatQuestSittingTime(
    sittingTime ?? resolvedGoal?.default_local_time ?? null
  );
  const sittingLabel = unplaced
    ? timeLabel
      ? `Unplaced · ${timeLabel}`
      : "Unplaced"
    : timeLabel ?? "Any time";
  const periodTarget = resolvedGoal
    ? presentation?.periodTarget ??
      (isPeriodCadenceGoal(resolvedGoal) ? cadencePeriodTarget(resolvedGoal) : null)
    : presentation?.periodTarget ?? null;
  const periodDone = presentation?.periodCompletionCount ?? null;

  return {
    id,
    title,
    categoryLabel: resolvedGoal
      ? getGoalCategoryLabel(resolvedGoal.category, resolvedGoal.category_key)
      : category
        ? getGoalCategoryLabel(category, null)
        : "Goal",
    color: visual.color,
    contribution: resolvedGoal?.description?.trim() || null,
    sittingLabel,
    cadenceLabel: resolvedGoal ? describeGoalCadence(resolvedGoal) : null,
    horizonLabel: resolvedGoal
      ? describeGoalHorizon(resolvedGoal.end_date, { dueDate: sittingDate })
      : endDate
        ? describeGoalHorizon(endDate, { dueDate: sittingDate })
        : null,
    effort: describeGoalEffort(resolvedGoal?.difficulty ?? null),
    periodDone,
    periodTarget,
    periodScopeLabel: resolvedGoal ? describePeriodScope(resolvedGoal) : null,
    isPrivate: Boolean(resolvedGoal?.is_private),
    completed,
    locked,
    linked,
  };
}
