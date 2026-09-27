export const concepts = [
  { id: "contour", name: "Contour", number: "01", premise: "Soft edges. Clear intent.", description: "A recessed control rail, porcelain surfaces, and broad fields of color.", tradeoff: "Approachable and tactile; uses more space to give each object room." },
  { id: "typeset", name: "Typeset", number: "02", premise: "Let the content lead.", description: "Open typography, shared rules, and controls that read like part of the page.", tradeoff: "Quiet and efficient; subtle controls need especially clear selected states." },
  { id: "signal", name: "Signal", number: "03", premise: "Every state has a signal.", description: "A compact instrument panel, precise labels, and a bright active accent.", tradeoff: "Fast to scan and distinctive; the density and contrast are more assertive." },
] as const;
export type Concept = typeof concepts[number]["id"];
export const surfaces = [
  { id: "planner", name: "Planner controls", prompt: "Switch views, filter the work, and complete a session.", question: "Which controls feel most intentional without competing with the work?" },
  { id: "history", name: "Completion history", prompt: "Inspect a day or step back to August. All three grids have touching cells.", question: "Which continuous grid makes your pattern easiest to read?" },
  { id: "goals", name: "Goal details", prompt: "Choose a goal, inspect its metadata, and open its details.", question: "Which treatment makes a goal feel like a meaningful object?" },
  { id: "progress", name: "Progress summaries", prompt: "Switch between this week and this month; inspect the breakdown.", question: "Which summary gives the clearest sense of momentum?" },
] as const;
export type Surface = typeof surfaces[number]["id"];
export type View = "Day" | "Week" | "Month";
export type Category = "All" | "Health" | "Craft";
export const goals = [
  { id: "run", title: "Run a comfortable 10K", short: "Easy run", category: "Health", cadence: "3 sessions / week", target: 12, baseline: 7, unit: "runs", end: "Sep 30", note: "Build a steady base. Keep the easy days easy.", color: "green" },
  { id: "film", title: "Make something worth sharing", short: "Edit the short film", category: "Craft", cadence: "2 sessions / week", target: 8, baseline: 4, unit: "sessions", end: "Sep 30", note: "One short film, from the first rough cut to the final frame.", color: "purple" },
  { id: "read", title: "Make room for reading", short: "Read for 30 minutes", category: "Craft", cadence: "4 sessions / week", target: 16, baseline: 9, unit: "sessions", end: "Sep 30", note: "A small daily space for ideas outside the usual feed.", color: "amber" },
] as const;
export const sessions = [
  { id: "run-mon", goalId: "run", day: 21, time: "07:30", duration: "40 min" },
  { id: "read-mon", goalId: "read", day: 21, time: "20:00", duration: "30 min" },
  { id: "film-tue", goalId: "film", day: 22, time: "18:00", duration: "60 min" },
  { id: "run-wed", goalId: "run", day: 23, time: "07:30", duration: "40 min" },
  { id: "read-wed", goalId: "read", day: 23, time: "20:00", duration: "30 min" },
  { id: "film-fri", goalId: "film", day: 25, time: "18:00", duration: "60 min" },
  { id: "run-sat", goalId: "run", day: 26, time: "09:00", duration: "45 min" },
] as const;
export type StudyState = {
  view: View; category: Category; query: string; completed: string[];
  month: 8 | 9; selectedDay: number; goalId: string; details: boolean;
  period: "week" | "month"; breakdown: boolean;
};
export function initialState(): StudyState {
  return { view: "Week", category: "All", query: "", completed: ["run-mon", "read-mon", "film-tue"], month: 9, selectedDay: 23, goalId: "run", details: false, period: "week", breakdown: false };
}
export type DemoProps = { concept: Concept; state: StudyState; update: (patch: Partial<StudyState>) => void };
export function goalFor(id: string) { return goals.find(goal => goal.id === id) ?? goals[0]; }
export function goalCount(id: string, completed: string[]) {
  return goalFor(id).baseline + sessions.filter(session => session.goalId === id && completed.includes(session.id)).length;
}
export function visibleSessions(state: StudyState) {
  return sessions.filter(session => {
    const goal = goalFor(session.goalId);
    return (state.category === "All" || goal.category === state.category) &&
      `${goal.title} ${goal.short}`.toLowerCase().includes(state.query.trim().toLowerCase()) &&
      (state.view !== "Day" || session.day === 23);
  });
}
// Fixed sample chronology: September 27, 2026. Baseline records precede the sample week.
const septemberBaseline = [1, 2, 0, 1, 2, 1, 0, 2, 1, 0, 2, 1, 2, 0, 1, 1, 2, 0, 1, 0];
export function dayCount(month: 8 | 9, day: number, completed: string[]) {
  if (month === 8) return day % 5 === 0 ? 0 : day % 3;
  if (day <= 20) return septemberBaseline[day - 1] ?? 0;
  return sessions.filter(session => session.day === day && completed.includes(session.id)).length;
}
export function monthDays(month: 8 | 9) {
  const days = month === 9 ? 30 : 31;
  const offset = month === 9 ? 1 : 5; // Monday first: Sep 1 Tuesday, Aug 1 Saturday.
  return Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= days ? day : null;
  });
}
export function progressFacts(state: StudyState) {
  const done = state.period === "week" ? state.completed.length : goals.reduce((sum, goal) => sum + goalCount(goal.id, state.completed), 0);
  const target = state.period === "week" ? sessions.length : goals.reduce((sum, goal) => sum + goal.target, 0);
  return { done, target, percent: Math.round(done / target * 100) };
}
