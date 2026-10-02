import { addDays, format, isValid, parseISO, startOfMonth, startOfWeek } from "date-fns";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import { getCompletionsForCurrentPeriod } from "@/lib/goals/schedule";
import { resolveChecklistCompletionIntent } from "@/lib/planner/completion-intent";
import { createSample, SAMPLE_GOALS, SAMPLE_TODAY, SAMPLE_THROUGH, type ScheduledSession } from "./sample";

export type SessionScope = "upcoming" | "all" | "history";
export type SessionGrouping = "week" | "month";
export const dateLabel = (date: string, pattern = "EEE, MMM d") => format(parseISO(date), pattern);
export const shiftDate = (date: string, days: number) => format(addDays(parseISO(date), days), "yyyy-MM-dd");
export const weekOf = (date: string) => format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), "yyyy-MM-dd");
export const isDone = (s: ScheduledSession, facts: CompletionDateFact[]) => facts.some(f => f.goal_id === s.goalId && f.completed_on === s.date);

export function completionIntent(s: ScheduledSession, facts: CompletionDateFact[]) {
  const goal = SAMPLE_GOALS.find(g => g.id === s.goalId)!;
  return resolveChecklistCompletionIntent({ goal, completions: facts.filter(f => f.goal_id === s.goalId), temporal: { selectedDate: s.date, asOfDate: SAMPLE_TODAY } });
}

export function sessionsForGoal(sessions: ScheduledSession[], goalId: string, scope: SessionScope) {
  return sessions.filter(s => s.goalId === goalId && (scope === "all" || (scope === "upcoming" ? s.date >= SAMPLE_TODAY : s.date < SAMPLE_TODAY)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
}

export function groupSessions(sessions: ScheduledSession[], grouping: SessionGrouping) {
  const groups = new Map<string, ScheduledSession[]>();
  for (const session of sessions) {
    const key = grouping === "week" ? weekOf(session.date) : format(startOfMonth(parseISO(session.date)), "yyyy-MM-dd");
    const entries = groups.get(key) ?? [];
    entries.push(session);
    groups.set(key, entries);
  }
  return Array.from(groups, ([date, entries]) => ({ date, entries,
    label: grouping === "month" ? dateLabel(date, "MMMM yyyy") : `Week of ${dateLabel(date, "MMM d")}` }));
}

export function goalProgress(goal: Goal, facts: CompletionDateFact[]) {
  const ownFacts = facts.filter(f => f.goal_id === goal.id);
  const lifetime = goal.target_basis === "lifetime";
  const credited = lifetime ? ownFacts : getCompletionsForCurrentPeriod(goal, ownFacts, parseISO(SAMPLE_TODAY), { weeklyAnchor: { weekStartsOn: 1 } });
  const done = new Set(credited.map(f => f.completed_on)).size;
  const target = goal.target_count ?? 1;
  const unit = lifetime ? "milestones" : goal.recurrence_interval === "daily" ? "today" : goal.recurrence_interval === "monthly" ? "this month" : "this week";
  return { done, target, unit, label: `${done} / ${target} ${unit}` };
}

export function sessionChangeError(session: ScheduledSession, date: string, time: string, sessions: ScheduledSession[], facts: CompletionDateFact[]): string | null {
  const goal = SAMPLE_GOALS.find(g => g.id === session.goalId)!;
  if (isDone(session, facts)) return "Completed dates stay in history. Undo the completion before moving this session.";
  if (session.locked) return "This date is locked. Unlock it before moving this session.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isValid(parseISO(date)) || format(parseISO(date), "yyyy-MM-dd") !== date) return "Choose a valid date.";
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return "Choose a valid time, or leave it as any time.";
  if (date < SAMPLE_TODAY || date < goal.start_date) return "Choose today or a later date inside this goal’s schedule.";
  if (goal.end_date && date > goal.end_date) return `This goal ends ${dateLabel(goal.end_date)}. Choose an earlier date.`;
  if (date > SAMPLE_THROUGH) return "The sample plan is saved through January 31. Choose a date inside that window.";
  if (sessions.some(s => s.id !== session.id && s.goalId === session.goalId && s.date === date)) return "This goal already has a session on that date. Choose another day.";
  if (session.milestone !== null) {
    const siblings = sessions.filter(s => s.goalId === session.goalId && s.milestone !== null && s.id !== session.id);
    if (siblings.some(s => s.milestone! < session.milestone! ? s.date >= date : s.date <= date)) return "Keep milestones in order. Choose a date between the neighboring milestones.";
  }
  return null;
}

export interface StudyState {
  saved: ScheduledSession[];
  sessions: ScheduledSession[];
  facts: CompletionDateFact[];
  notice: string;
}
export function initialStudyState(): StudyState {
  const { sessions, facts } = createSample();
  return { saved: sessions, sessions, facts, notice: "" };
}
export type StudyAction =
  | { type: "edit"; id: string; date: string; time: string }
  | { type: "lock"; id: string }
  | { type: "complete"; id: string }
  | { type: "save" }
  | { type: "discard" }
  | { type: "reset" };

export const sessionIsDraft = (state: StudyState, s: ScheduledSession) => {
  const saved = state.saved.find(entry => entry.id === s.id);
  return !saved || saved.date !== s.date || saved.time !== s.time || saved.locked !== s.locked;
};
export const draftCount = (state: StudyState) => state.sessions.filter(s => sessionIsDraft(state, s)).length;

/** Local study mutations only. Eligibility uses the production checklist intent. */
export function studyReducer(state: StudyState, action: StudyAction): StudyState {
  if (action.type === "reset") return initialStudyState();
  if (action.type === "save") return { ...state, saved: state.sessions, notice: "Sample plan saved. Your scheduled dates are up to date." };
  if (action.type === "discard") return { ...state, sessions: state.saved, notice: "Date changes undone. Completions stay in your history." };
  const session = state.sessions.find(s => s.id === action.id);
  if (!session) return state;
  if (action.type === "edit") {
    const error = sessionChangeError(session, action.date, action.time, state.sessions, state.facts);
    if (error) return { ...state, notice: error };
    return { ...state, sessions: state.sessions.map(s => s.id === action.id ? { ...s, date: action.date, time: action.time } : s), notice: `Moved ${session.name} to ${dateLabel(action.date)}. Save to keep this date.` };
  }
  if (action.type === "lock") {
    if (isDone(session, state.facts)) return state;
    return { ...state, sessions: state.sessions.map(s => s.id === action.id ? { ...s, locked: !s.locked } : s), notice: session.locked ? "Date unlocked. Save to keep this change." : "Date locked. Save to keep this change." };
  }
  if (sessionIsDraft(state, session)) return { ...state, notice: "Save your date changes before logging this session." };
  const intent = completionIntent(session, state.facts);
  if (!intent.allowed) return { ...state, notice: "You can complete a session on its scheduled day, or later." };
  const remove = intent.mutation.desiredFactState === "absent";
  const facts = remove ? state.facts.filter(f => !(f.goal_id === session.goalId && f.completed_on === session.date)) : [...state.facts, { goal_id: session.goalId, completed_on: session.date, source: "manual" as const }];
  return { ...state, facts, notice: remove ? `Completion undone for ${session.name}.` : `${session.name} complete. Added to your history.` };
}
