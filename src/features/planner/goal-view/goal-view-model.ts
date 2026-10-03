import { format, parseISO } from "date-fns";
import { isEntryCredited } from "@/features/planner/calendar-format";
import { isPlannerTaskCalendarEntry } from "@/features/planner/calendar-task-entries";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import { addDaysToDateString, startOfWeekDateString } from "@/lib/goals/periods";
import type { Goal } from "@/lib/goals/types";

/** 60 + 300 + today = 361 days, inside MAX_PLANNER_WINDOW_DAYS (366). */
export const GOAL_VIEW_DAYS_BACK = 60;
export const GOAL_VIEW_DAYS_FORWARD = 300;
export const GOAL_VIEW_PAGE_SIZE = 12;


export interface GoalViewWindow {
  start: string;
  end: string;
}

export interface GoalViewSession {
  key: string;
  goalId: string;
  date: string;
  /** 24-hour HH:MM, or "" when the session has no time. */
  time: string;
  label: string;
  milestone: number | null;
  locked: boolean;
  done: boolean;
  draft: boolean;
  entry: PlannerDayDetailEntry;
}

export const dateLabel = (date: string, pattern = "EEE, MMM d") =>
  format(parseISO(date), pattern);

export function buildGoalViewWindow(today: string): GoalViewWindow {
  return {
    start: addDaysToDateString(today, -GOAL_VIEW_DAYS_BACK),
    end: addDaysToDateString(today, GOAL_VIEW_DAYS_FORWARD),
  };
}

export function listWindowDays({ start, end }: GoalViewWindow) {
  const days: string[] = [];
  for (let day = start; day <= end; day = addDaysToDateString(day, 1)) {
    days.push(day);
  }
  return days;
}

function milestoneNumber(unitKey: string) {
  const match = /^milestone:(\d+)$/.exec(unitKey);
  return match ? Number(match[1]) : null;
}

/**
 * Reads the planner's own filtered, ordered day entries so Goal View shows
 * exactly the sessions the calendar would, including unsaved draft moves.
 */
export function buildGoalViewSessions(
  days: readonly string[],
  getEntriesForDay: (day: string) => PlannerDayDetailEntry[]
): GoalViewSession[] {
  const sessions: GoalViewSession[] = [];
  for (const date of days) {
    for (const entry of getEntriesForDay(date)) {
      if (entry.draftGhost || isPlannerTaskCalendarEntry(entry)) {
        continue;
      }
      sessions.push({
        key: entry.key,
        goalId: entry.originalGoalId,
        date,
        time: entry.effectiveScheduledLocalTime ?? "",
        label: entry.label ?? entry.goalTitle ?? "Session",
        milestone: milestoneNumber(entry.unitKey),
        locked: Boolean(entry.activeItem?.locked),
        done: isEntryCredited(entry),
        draft: entry.draftDiffKind !== null,
        entry,
      });
    }
  }
  return sessions;
}

const byDateTime = (a: GoalViewSession, b: GoalViewSession) =>
  a.date.localeCompare(b.date) ||
  (a.time || "24:00").localeCompare(b.time || "24:00") ||
  a.key.localeCompare(b.key);

/** One goal's sessions by date; past ones only when `showPast` is on. */
export function sessionsForGoal(
  sessions: readonly GoalViewSession[],
  goalId: string,
  showPast: boolean,
  today: string
) {
  return sessions
    .filter(
      (session) =>
        session.goalId === goalId && (showPast || session.date >= today)
    )
    .sort(byDateTime);
}

/** Goals with a session today or later. */
export function goalIdsWithUpcomingSessions(
  sessions: readonly GoalViewSession[],
  today: string
) {
  return new Set(
    sessions.filter((session) => session.date >= today).map((s) => s.goalId)
  );
}

/**
 * Goals that have at least one session, in the planner's own goal order so
 * cards never reshuffle while dates are completed or moved. Goals that ended
 * before today, or have nothing left to do, only appear with `showPast`.
 */
export function selectGoalViewGoals(
  goals: readonly Goal[],
  sessions: readonly GoalViewSession[],
  { showPast, today }: { showPast: boolean; today: string }
) {
  if (showPast) {
    const withSessions = new Set(sessions.map((session) => session.goalId));
    return goals.filter((goal) => withSessions.has(goal.id));
  }
  const upcoming = goalIdsWithUpcomingSessions(sessions, today);
  return goals.filter(
    (goal) =>
      upcoming.has(goal.id) && !(goal.end_date && goal.end_date < today)
  );
}

/** Sessions grouped by planner week, in the order given. */
export function groupSessions(
  sessions: readonly GoalViewSession[],
  weekStartsOn: number
) {
  const groups = new Map<string, GoalViewSession[]>();
  for (const session of sessions) {
    const key = startOfWeekDateString(session.date, weekStartsOn);
    groups.set(key, [...(groups.get(key) ?? []), session]);
  }
  return Array.from(groups, ([date, entries]) => ({
    date,
    entries,
    label: `Week of ${dateLabel(date, "MMM d")}`,
  }));
}
