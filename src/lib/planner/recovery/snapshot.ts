import type { Completion, Goal } from "@/lib/goals/types";
import { addDaysToDateString } from "@/lib/goals/periods";
import { getDateInTimezone } from "@/lib/dates/timezone";
import { PlannerRouteError } from "@/lib/planner/api";
import {
  loadPlannerPreparationSnapshot,
  type PlannerItemRow,
} from "@/lib/planner/context-loader";
import { reconcilePersistedGoalCompletions } from "@/lib/planner/persisted-completion-reconciliation";
import { normalizeGoalRequirement, type GoalRequirement } from "@/lib/planner/requirements";
import type { PlannerWorkUnit } from "@/lib/planner/work-units";
import type {
  RecoveryGoal,
  RecoverySession,
  RecoverySnapshot,
} from "@/lib/planner/recovery/contract";

/** Six weeks ahead: far enough for a month-long credit window, short enough to read. */
export const RECOVERY_HORIZON_DAYS = 42;

export type RecoveryClient = Parameters<typeof loadPlannerPreparationSnapshot>[0]["supabase"];

/** A saved planner session with its credit state resolved by the planner's own reconciliation. */
export interface AnnotatedPlannerSession {
  goalId: string;
  unitKey: string;
  date: string;
  locked: boolean;
  credited: boolean;
  /** Last day a completion can still credit this session; null when the unit is unknown. */
  creditWindowEnd: string | null;
  requirementKind: GoalRequirement["kind"];
  label: string;
}

export interface RecoveryDismissal {
  goalId: string;
  missedOn: string;
}

function sessionLabel(requirement: GoalRequirement, unit: PlannerWorkUnit | undefined) {
  if (!unit) return "Session";
  if (requirement.kind === "milestone_sequence") {
    return unit.label?.trim() || `Milestone ${unit.ordinal}`;
  }
  return requirement.targetCount > 1
    ? `Session ${unit.ordinal} of ${requirement.targetCount}`
    : "Session";
}

/**
 * Credit state for every saved session, matched exactly as preview and save
 * match it: a completion on another day of the credit window still counts.
 */
export function annotatePlannerSessions({
  goals,
  completions,
  items,
  asOfDate,
  weekStartsOn,
}: {
  goals: Goal[];
  completions: Completion[];
  items: Pick<PlannerItemRow, "goal_id" | "unit_key" | "scheduled_date" | "locked">[];
  asOfDate: string;
  weekStartsOn?: number;
}): AnnotatedPlannerSession[] {
  const sessions: AnnotatedPlannerSession[] = [];
  for (const goal of goals) {
    const goalItems = items.filter((item) => item.goal_id === goal.id);
    if (goalItems.length === 0) continue;
    const { requirement } = normalizeGoalRequirement(goal);
    const { units } = reconcilePersistedGoalCompletions({
      goal,
      completions,
      persistedItems: goalItems,
      asOfDate,
      weekStartsOn,
    });
    const unitByKey = new Map(units.map((unit) => [unit.unitKey, unit]));
    for (const item of goalItems) {
      const unit = unitByKey.get(item.unit_key);
      sessions.push({
        goalId: goal.id,
        unitKey: item.unit_key,
        date: item.scheduled_date,
        locked: item.locked,
        credited: unit ? unit.creditState !== "uncredited" : false,
        creditWindowEnd: unit?.creditWindow.end ?? null,
        requirementKind: requirement.kind,
        label: sessionLabel(requirement, unit),
      });
    }
  }
  return sessions;
}

function earliest(dates: Array<string | null>) {
  return dates.reduce<string | null>(
    (min, date) => (date !== null && (min === null || date < min) ? date : min),
    null
  );
}

/**
 * What the review works from: every goal's sessions from today to the horizon,
 * plus the missed sessions that can still earn credit. A miss is recoverable
 * when it is uncredited, unlocked, not let go, and its credit window (capped by
 * the goal's end and the horizon) still includes today.
 */
export function buildRecoverySnapshot({
  goals,
  sessions,
  completions,
  dismissals,
  restWeekdays,
  blackoutRanges,
  today,
}: {
  goals: Goal[];
  sessions: AnnotatedPlannerSession[];
  completions: Completion[];
  dismissals: RecoveryDismissal[];
  restWeekdays: number[];
  blackoutRanges: Array<{ start: string; end: string }>;
  today: string;
}): RecoverySnapshot {
  const horizonEnd = addDaysToDateString(today, RECOVERY_HORIZON_DAYS - 1);
  const goalById = new Map(
    goals.filter((goal) => goal.archived_at === null).map((goal) => [goal.id, goal])
  );
  const dismissed = new Set(dismissals.map((item) => `${item.goalId}:${item.missedOn}`));

  const snapshotSessions: RecoverySession[] = [];
  for (const session of sessions) {
    const goal = goalById.get(session.goalId);
    if (!goal) continue;
    const base = {
      id: `${session.goalId}:${session.date}`,
      goalId: session.goalId,
      unitKey: session.unitKey,
      date: session.date,
      label: session.label,
      locked: session.locked,
    };
    if (session.date >= today) {
      if (session.date > horizonEnd) continue;
      snapshotSessions.push({
        ...base,
        status: session.credited ? "done" : "scheduled",
        windowEnd: null,
      });
      continue;
    }
    if (session.credited || session.locked || dismissed.has(base.id)) continue;
    const windowEnd = earliest([session.creditWindowEnd, goal.end_date, horizonEnd]);
    if (session.creditWindowEnd === null || windowEnd === null || windowEnd < today) continue;
    snapshotSessions.push({ ...base, status: "missed", windowEnd });
  }
  snapshotSessions.sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.goalId.localeCompare(b.goalId)
  );

  const goalsWithSessions = new Set(sessions.map((session) => session.goalId));
  const snapshotGoals: RecoveryGoal[] = [...goalById.values()]
    .filter((goal) => goalsWithSessions.has(goal.id))
    .sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
    .map((goal) => {
      const { requirement } = normalizeGoalRequirement(goal);
      const interval = requirement.kind === "cadence" ? requirement.interval : null;
      return {
        id: goal.id,
        title: goal.title,
        kind: requirement.kind,
        interval,
        endDate: goal.end_date,
        // Daily cadence is never rest-eligible in the planner either.
        restDays: interval === "daily" ? [] : restWeekdays,
        completedDates: completions
          .filter(
            (completion) =>
              completion.goal_id === goal.id &&
              completion.completed_on >= today &&
              completion.completed_on <= horizonEnd
          )
          .map((completion) => completion.completed_on),
      };
    });

  return {
    today,
    horizonEnd,
    blackoutRanges,
    goals: snapshotGoals,
    sessions: snapshotSessions,
  };
}

async function loadDismissals(supabase: RecoveryClient, userId: string) {
  const { data, error } = await supabase
    .from("planner_recovery_dismissals")
    .select("goal_id,missed_on")
    .eq("owner_id", userId);
  if (error) {
    throw new PlannerRouteError(500, "recovery_load_failed", "Recovery data could not be loaded.", {
      cause: error.message,
    });
  }
  return (data ?? []).map((row) => ({ goalId: row.goal_id, missedOn: row.missed_on }));
}

export interface RecoveryContext {
  recovery: RecoverySnapshot;
  goals: Goal[];
  sessions: AnnotatedPlannerSession[];
  today: string;
}

/** One read feeds the review, the Agenda count, and the check-in facts. */
export async function loadRecoveryContext({
  supabase,
  userId,
  now = new Date(),
}: {
  supabase: RecoveryClient;
  userId: string;
  now?: Date;
}): Promise<RecoveryContext> {
  const [{ snapshot, persistedItems }, dismissals] = await Promise.all([
    loadPlannerPreparationSnapshot({ supabase, ownerId: userId }),
    loadDismissals(supabase, userId),
  ]);
  const policy = snapshot.preferences?.default_policy;
  const today = getDateInTimezone(now, snapshot.preferences?.timezone ?? "UTC");
  const sessions = annotatePlannerSessions({
    goals: snapshot.goals,
    completions: snapshot.completions,
    items: persistedItems,
    asOfDate: today,
    weekStartsOn: policy?.weekStartsOn,
  });
  return {
    recovery: buildRecoverySnapshot({
      goals: snapshot.goals,
      sessions,
      completions: snapshot.completions,
      dismissals,
      restWeekdays: policy?.restWeekdays ?? [],
      blackoutRanges: policy?.blackoutRanges ?? [],
      today,
    }),
    goals: snapshot.goals,
    sessions,
    today,
  };
}