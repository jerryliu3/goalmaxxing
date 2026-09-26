import { format, isValid, parse, parseISO } from "date-fns";
import { getEntryMilestoneFirstTitle } from "@/features/planner/calendar-format";
import { getGoalVisual } from "@/features/planner/goal-visuals";
import type { ChecklistGoalPresentation } from "@/lib/goals/checklist-presentation";
import { getGoalCategoryLabel } from "@/lib/goals/category";
import {
  cadencePeriodTarget,
  isDeadlineTotalGoal,
  isPeriodCadenceGoal,
} from "@/lib/goals/target-basis";
import type { Goal } from "@/lib/goals/types";

export interface WorkQuestProgress {
  completed: number;
  target: number;
  label: string;
}

export interface WorkQuestModel {
  id: string;
  title: string;
  categoryLabel: string;
  color: string;
  cadenceLabel: string | null;
  deadlineLabel: string;
  progress: WorkQuestProgress | null;
  completed: boolean;
  periodCadence?: boolean;
}

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

export function formatQuestSittingDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  if (!isValid(parsed)) {
    return value;
  }
  return format(parsed, "EEE, MMM d");
}

function formatQuestDeadline(value: string | null | undefined): string {
  if (!value) {
    return "No deadline";
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "MMM d, yyyy") : value;
}

function formatQuestCadence(goal: Goal | null): string | null {
  if (!goal) {
    return null;
  }
  if (goal.frequency_type === "fixed_milestones") {
    const milestones = goal.target_count ?? 0;
    return milestones === 1 ? "1 milestone" : `${milestones} milestones`;
  }
  if (isDeadlineTotalGoal(goal)) {
    const sessions = goal.target_count ?? 1;
    return sessions === 1 ? "One session in total" : `${sessions} sessions in total`;
  }
  if (goal.recurrence_interval === "daily") {
    return "Every day";
  }
  const target = cadencePeriodTarget(goal);
  if (goal.recurrence_interval === "monthly") {
    return target === 1 ? "1 day a month" : `${target} days a month`;
  }
  return target === 1 ? "Once a week" : `${target} days a week`;
}

function periodScopeLabel(goal: Goal) {
  if (goal.recurrence_interval === "daily") {
    return "today";
  }
  if (goal.recurrence_interval === "weekly") {
    return "this week";
  }
  return "this month";
}

function projectQuestProgress({
  goal,
  unitKey,
  presentation,
  completed,
}: {
  goal: Goal | null;
  unitKey: string;
  presentation: ChecklistGoalPresentation | null;
  completed: boolean;
}): WorkQuestProgress | null {
  if (!goal || !goal.target_count || goal.target_count < 1) {
    return null;
  }
  const target = goal.target_count;

  if (goal.frequency_type === "fixed_milestones") {
    const milestoneNumber = Number(/^milestone:(\d+)$/i.exec(unitKey)?.[1]);
    if (!Number.isFinite(milestoneNumber) || milestoneNumber < 1) {
      return null;
    }
    const currentMilestone = Math.min(milestoneNumber, target);
    const completedMilestones = Math.max(
      presentation?.lifetimeCompletionCount ?? 0,
      completed ? currentMilestone : currentMilestone - 1
    );
    return {
      completed: Math.min(completedMilestones, target),
      target,
      label: `Milestone ${currentMilestone} of ${target}`,
    };
  }

  if (isPeriodCadenceGoal(goal)) {
    const periodTarget = presentation?.periodTarget ?? target;
    const periodCompleted = presentation?.periodCompletionCount ?? 0;
    return {
      completed: Math.min(periodCompleted, periodTarget),
      target: periodTarget,
      label: `${periodCompleted} of ${periodTarget} ${periodScopeLabel(goal)}`,
    };
  }

  if (isDeadlineTotalGoal(goal)) {
    const lifetimeCompleted = presentation?.lifetimeCompletionCount ?? 0;
    return {
      completed: Math.min(lifetimeCompleted, target),
      target,
      label: `${lifetimeCompleted} of ${target} total`,
    };
  }

  return null;
}

export function projectPlannerEntryWorkQuest({
  entry,
  goal = null,
  presentation = null,
  completed,
}: {
  entry: {
    key: string;
    originalGoalId: string;
    goalTitle: string | null;
    label: string | null;
    unitKey: string;
    activeGoal?: {
      category?: string | null;
      color?: string | null;
      end_date?: string | null;
    } | null;
  };
  goal?: Goal | null;
  presentation?: ChecklistGoalPresentation | null;
  completed: boolean;
}): WorkQuestModel {
  const category = goal?.category ?? entry.activeGoal?.category ?? null;
  const visual = getGoalVisual({
    goalId: entry.originalGoalId,
    color: goal?.color ?? entry.activeGoal?.color ?? null,
    category,
  });

  return {
    id: entry.originalGoalId,
    title: getEntryMilestoneFirstTitle(entry),
    categoryLabel: goal
      ? getGoalCategoryLabel(goal.category, goal.category_key)
      : category
        ? getGoalCategoryLabel(category, null)
        : "Goal",
    color: visual.color,
    cadenceLabel: formatQuestCadence(goal),
    deadlineLabel: formatQuestDeadline(goal?.end_date ?? entry.activeGoal?.end_date),
    progress: projectQuestProgress({
      goal,
      unitKey: entry.unitKey,
      presentation,
      completed,
    }),
    periodCadence: goal ? isPeriodCadenceGoal(goal) : false,
    completed,
  };
}
