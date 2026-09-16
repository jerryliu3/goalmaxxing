import { format, parseISO } from "date-fns";
import { countCompletionsByDate } from "@/lib/goals/completion-grouping";
import { ACTIVE_GOALS, COMPLETIONS, INITIAL_MONTH, WEEK_ROWS } from "./seed";

export type OverviewView = "overview" | "history" | "patterns" | "folios";
export const STUDY_PATH = "/ux/progress-overview";
export function parseOverviewView(value: string | null): OverviewView {
  return value === "history" || value === "patterns" || value === "folios" ? value : "overview";
}
export function viewHref(view: OverviewView) {
  return view === "overview" ? STUDY_PATH : `${STUDY_PATH}?view=${view}`;
}
export function selectedFacts(ids: readonly string[]) {
  return COMPLETIONS.filter(fact => ids.includes(fact.goal_id));
}
export function historyCounts(ids: readonly string[]) {
  return countCompletionsByDate(selectedFacts(ids));
}
export const MONTH_FACTS = COMPLETIONS.filter(fact => fact.completed_on.startsWith(INITIAL_MONTH));
export const MONTH_COUNTS = countCompletionsByDate(MONTH_FACTS);
export const WEEK_SUMMARY = {
  done: WEEK_ROWS.flatMap(row => row.days).filter(day => day.state === "complete").length,
  planned: WEEK_ROWS.flatMap(row => row.days).filter(day => day.state !== "empty").length,
};
export const WEEKDAY_COUNTS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(label => ({
  label,
  count: MONTH_FACTS.filter(fact => format(parseISO(fact.completed_on), "EEE") === label).length,
}));
export const GOAL_COUNTS = ACTIVE_GOALS.map(goal => ({
  id: goal.id, title: goal.title,
  count: MONTH_FACTS.filter(fact => fact.goal_id === goal.id).length,
}));
