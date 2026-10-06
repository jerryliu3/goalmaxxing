import { format, parseISO } from "date-fns";
import { isEntryCredited } from "@/features/planner/calendar-format";
import { isPlannerTaskCalendarEntry } from "@/features/planner/calendar-task-entries";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import {
  addDaysToDateString,
  getAnchoredPeriod,
  startOfWeekDateString,
} from "@/lib/goals/periods";
import { cadencePeriodTarget, parseCadenceUnitKey } from "@/lib/goals/target-basis";
import type { Goal } from "@/lib/goals/types";

/** One rolling 90-day window: 21 prior days, today, and 68 following days. */
export const GOAL_VIEW_DAYS_BACK = 21;
export const GOAL_VIEW_DAYS_FORWARD = 68;
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

/** Date, then time (untimed last), then key: one stable order for sessions. */
export const byDateTime = (a: GoalViewSession, b: GoalViewSession) =>
  a.date.localeCompare(b.date) ||
  (a.time || "24:00").localeCompare(b.time || "24:00") ||
  a.key.localeCompare(b.key);

/** One goal's sessions from today on, by date. */
export function upcomingSessionsForGoal(
  sessions: readonly GoalViewSession[],
  goalId: string,
  today: string
) {
  return sessions
    .filter((session) => session.goalId === goalId && session.date >= today)
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
 * before today, or have nothing left to do, only appear with `includePast`
 * (the calendar, which shows past dates).
 */
export function selectGoalViewGoals(
  goals: readonly Goal[],
  sessions: readonly GoalViewSession[],
  { includePast, today }: { includePast: boolean; today: string }
) {
  if (includePast) {
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

const PER_PERIOD = { daily: "per day", weekly: "per week", monthly: "per month" } as const;
const PERIOD = { daily: "Day", weekly: "Week", monthly: "Month" } as const;

/**
 * Which session each one is toward its goal's target, by the kind of unit it
 * fills: "2 of 3 per week" for a cadence goal, "12 of 30" toward a lifetime
 * total, "2 of 5" for milestones.
 * The planner's unit keys carry the slot; where a key has none, a cadence
 * session counts its place among the goal's sessions in the same period. A
 * goal with one session per period counts periods instead: "Week 6" since it
 * started.
 */
export function sessionOrdinals(
  goals: readonly Goal[],
  sessions: readonly GoalViewSession[],
  weekStartsOn: number
) {
  const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
  const ordinals = new Map<string, string>();
  const periodPlaces = new Map<string, number>();
  for (const session of [...sessions].sort(byDateTime)) {
    const goal = goalsById.get(session.goalId);
    if (!goal) continue;
    // The unit key says what kind of requirement the session fills.
    const unitKey = session.entry.unitKey;
    const indexed = /^(?:milestone|total):(\d+)$/.exec(unitKey);
    if (indexed) {
      ordinals.set(session.key, `${indexed[1]} of ${goal.target_count ?? 1}`);
      continue;
    }
    if (!unitKey.startsWith("cadence:") || !goal.recurrence_interval) continue;
    const perPeriod = cadencePeriodTarget(goal);
    const { index, periodKey } = getAnchoredPeriod(goal.start_date, goal.recurrence_interval, session.date, {
      weekStartsOn,
    });
    if (perPeriod < 2) {
      ordinals.set(session.key, `${PERIOD[goal.recurrence_interval]} ${index + 1}`);
      continue;
    }
    const placeKey = `${goal.id}|${periodKey}`;
    const place = (periodPlaces.get(placeKey) ?? 0) + 1;
    periodPlaces.set(placeKey, place);
    const slot = parseCadenceUnitKey(session.entry.unitKey)?.slot ?? place;
    ordinals.set(session.key, `${slot} of ${perPeriod} ${PER_PERIOD[goal.recurrence_interval]}`);
  }
  return ordinals;
}
