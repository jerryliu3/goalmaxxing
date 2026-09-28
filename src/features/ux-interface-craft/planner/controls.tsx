import { Search } from "lucide-react";
import { goals, type Category, type StudyState, type View } from "../model";
import s from "./planner.module.css";

export type PlannerControlsProps = {
  state: StudyState;
  update: (patch: Partial<StudyState>) => void;
};

export function ViewControl({ state, update }: PlannerControlsProps) {
  return <div className={s.viewControl} role="group" aria-label="Planner view">
    {(["Day", "Week", "Month"] as View[]).map(view => (
      <button key={view} aria-pressed={state.view === view} onClick={() => update({ view })}>{view}</button>
    ))}
  </div>;
}

export function CategoryControl({ state, update }: PlannerControlsProps) {
  return <div className={s.categories} role="group" aria-label="Filter goals">
    {(["All", "Health", "Craft"] as Category[]).map(category => (
      <button key={category} aria-pressed={state.category === category} onClick={() => update({ category, plannerGoalId: null })}>{category}</button>
    ))}
  </div>;
}

export function SearchControl({ state, update }: PlannerControlsProps) {
  return <label className={s.search}>
    <Search size={15} aria-hidden="true" />
    <input type="search" aria-label="Search sample goals" placeholder="Find a goal…" value={state.query} onChange={event => update({ query: event.target.value })} />
  </label>;
}

export function GoalControl({ state, update }: PlannerControlsProps) {
  return <label className={s.selectLabel}>Goal
    <select aria-label="Goal scope" value={state.plannerGoalId ?? "all"} onChange={event => update({ plannerGoalId: event.target.value === "all" ? null : event.target.value, category: "All" })}>
      <option value="all">All goals</option>
      {goals.map(goal => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
    </select>
  </label>;
}

export function ScopeSummary({ state, update }: PlannerControlsProps) {
  const active = state.category !== "All" || state.query.trim() || state.plannerGoalId;
  if (!active) return null;
  return <div className={s.scopeSummary}>
    <span>Showing {state.plannerGoalId ? goals.find(goal => goal.id === state.plannerGoalId)?.title : state.category === "All" ? "all goals" : state.category.toLowerCase()}{state.query.trim() ? ` matching “${state.query.trim()}”` : ""}</span>
    <button onClick={() => update({ category: "All", query: "", plannerGoalId: null })}>Clear scope</button>
  </div>;
}
