import type { CalendarMonthCellEntryBase } from "@/features/planner/calendar-month-day-cell";
import type { Goal } from "@/lib/goals/types";
import { isDone, sessionIsDraft, shiftDate, weekOf } from "./model";
import type { ScheduledSession } from "./sample";
import type { GoalViewStudySession } from "./use-study";

export function weaveWeekDates(anchor: string) {
  const start = weekOf(anchor);
  return Array.from({ length: 7 }, (_, index) => shiftDate(start, index));
}

export function sessionsOnDate(sessions: ScheduledSession[], date: string, goalIds: string[]) {
  return sessions.filter(s => s.date === date && goalIds.includes(s.goalId))
    .sort((a, b) => (a.time || "24:00").localeCompare(b.time || "24:00") || a.id.localeCompare(b.id));
}

export interface StudyCalendarEntry extends CalendarMonthCellEntryBase {
  session: ScheduledSession;
}

export function studyCalendarEntry(session: ScheduledSession, goal: Goal, state: GoalViewStudySession["state"]): StudyCalendarEntry {
  const draft = sessionIsDraft(state, session);
  const saved = state.saved.find(s => s.id === session.id);
  return {
    key: session.id, entryKind: "goal", originalGoalId: goal.id,
    goalTitle: goal.title, unitKey: session.milestone ? `milestone:${session.milestone}` : "recurring",
    label: session.name, classification: "scheduled",
    creditState: isDone(session, state.facts) ? "credited" : "uncredited",
    activeGoal: goal, activeItem: { id: session.id },
    draftDiffKind: draft ? "moved_to" : null,
    draftDiffFromDate: draft ? saved?.date ?? null : null,
    draftDiffToDate: draft ? session.date : null, draftGhost: false,
    session,
  };
}
