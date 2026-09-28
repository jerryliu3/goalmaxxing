import { useState } from "react";
import { Check, ChevronRight, PanelLeft, SlidersHorizontal, X } from "lucide-react";
import { goals, goalFor, visibleSessions, sessions } from "./model";
import { PlannerCalendar } from "./planner/calendar";
import { CategoryControl, GoalControl, ScopeSummary, SearchControl, ViewControl, type PlannerControlsProps } from "./planner/controls";
import { ViewComposer } from "./planner/view-composer";
import type { PlannerVariant } from "./planner/concepts";
import base from "./study.module.css";
import s from "./planner/planner.module.css";

export function PlannerConcept({ variant, state, update }: PlannerControlsProps & { variant: PlannerVariant }) {
  const [navigatorOpen, setNavigatorOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string>();
  const entries = visibleSessions(state);
  const selected = entries.find(entry => entry.id === selectedId);
  const heading = state.view === "Day" ? `September ${state.focusDay}` : state.view === "Month" ? "September" : "September 21–27";
  const activeFilters = Number(state.category !== "All") + Number(Boolean(state.plannerGoalId)) + Number(Boolean(state.query.trim()));
  const controls = { state, update };

  function selectGoal(id: string | null) {
    update({ plannerGoalId: id, category: "All", query: "" });
  }
  function completeSelected() {
    if (!selected) return;
    update({ completed: state.completed.includes(selected.id)
      ? state.completed.filter(id => id !== selected.id)
      : [...state.completed, selected.id] });
  }
  const toggleNavigator = <button className={s.action} aria-expanded={navigatorOpen} onClick={() => setNavigatorOpen(value => !value)}>
    <PanelLeft size={16} />{navigatorOpen ? "Hide navigator" : "Browse goals"}
  </button>;

  return <div className={s.planner}>
    <header className={s.header}>
      <div><p className={base.eyebrow}>Your plan · 2026</p><h3>{heading}</h3><p>{state.completed.length} of {sessions.length} sample sessions complete</p></div>
      {variant === "navigator" && toggleNavigator}
      {variant === "canvas" && <details className={s.filterDisclosure}>
        <summary><SlidersHorizontal size={15} />Filter work{activeFilters > 0 ? ` · ${activeFilters}` : ""}</summary>
        <div className={s.filterPanel}>
          <CategoryControl {...controls} /><GoalControl {...controls} /><SearchControl {...controls} />
        </div>
      </details>}
    </header>

    {variant === "toolbar" && <div className={s.toolbar}>
      <div><ViewControl {...controls} /><CategoryControl {...controls} /></div>
      <div><GoalControl {...controls} /><SearchControl {...controls} /></div>
    </div>}

    {variant === "canvas" && <nav className={s.breadcrumb} aria-label="Calendar zoom">
      <button aria-current={state.view === "Month" ? "page" : undefined} onClick={() => { update({ view: "Month" }); setSelectedId(undefined); }}>September</button>
      {(state.view === "Week" || (state.view === "Day" && state.focusDay >= 21 && state.focusDay <= 27)) && <><ChevronRight size={14} /><button aria-current={state.view === "Week" ? "page" : undefined} onClick={() => { update({ view: "Week" }); setSelectedId(undefined); }}>Week of 21</button></>}
      {state.view === "Day" && <><ChevronRight size={14} /><span aria-current="page">Sep {state.focusDay}</span></>}
      <small>Open a date to zoom in</small>
    </nav>}

    {variant === "composer" && <ViewComposer {...controls} />}

    <div className={s.workspace} data-sidebar={variant === "navigator" && navigatorOpen}>
      {variant === "navigator" && navigatorOpen && <aside className={s.navigator} aria-label="Goal navigator">
        <p className={base.eyebrow}>Choose an intention</p>
        <div className={s.goalList} role="group" aria-label="Navigate by goal">
          <button aria-pressed={state.plannerGoalId === null} onClick={() => selectGoal(null)}><strong>All goals</strong><span>The complete picture</span></button>
          {goals.map(goal => <button key={goal.id} aria-pressed={state.plannerGoalId === goal.id} onClick={() => selectGoal(goal.id)}>
            <strong>{goal.title}</strong><span>{goal.cadence}</span><small>{sessions.filter(session => session.goalId === goal.id).length} placed this week</small>
          </button>)}
        </div>
        <details className={s.refine}><summary>Refine this view</summary><CategoryControl {...controls} /><SearchControl {...controls} /></details>
      </aside>}
      <div className={s.canvasColumn}>
        {variant === "navigator" && <div className={s.navigatorHeading}><div><small>Viewing</small><strong>{state.plannerGoalId ? goalFor(state.plannerGoalId).title : "All goals"}</strong></div><ViewControl {...controls} /></div>}
        <ScopeSummary {...controls} />
        <PlannerCalendar state={state} update={update} contextual={variant === "canvas"} selectedId={selected?.id} onSelect={setSelectedId} />
        {variant === "canvas" && <div className={s.contextDock} aria-label="Selected session actions" role="region">
          {selected ? <>
            <div aria-live="polite"><small>Selected session · Sep {selected.day}</small><strong>{goalFor(selected.goalId).short}</strong></div>
            <div className={s.dockActions}>
              <button className={s.primary} onClick={completeSelected}><Check size={15} />{state.completed.includes(selected.id) ? "Undo completion" : "Mark complete"}</button>
              {state.view !== "Day" && <button className={s.action} onClick={() => update({ focusDay: selected.day, view: "Day" })}>Open day</button>}
              <button className={s.action} aria-label="Clear selection" onClick={() => setSelectedId(undefined)}><X size={16} /></button>
            </div>
          </> : <><div><small>Actions appear with your selection</small><strong>Select a session on the calendar</strong></div><span className={s.dockHint}>Then complete it or open its day.</span></>}
        </div>}
      </div>
    </div>
  </div>;
}
