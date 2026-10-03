"use client";

import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import type { Goal } from "@/lib/goals/types";
import { GoalCard, GoalMetadata } from "./goal-panel";
import { dateLabel, isDone, sessionsForGoal, shiftDate, type SessionScope } from "./model";
import { SAMPLE_TODAY } from "./sample";
import type { GoalViewStudySession } from "./use-study";
import type { useWeaveNavigation } from "./use-weave-navigation";
import { AXIS_END, AXIS_START } from "./weave-axis";
import { WeaveTimeline } from "./weave-timeline";

export function GoalWeavePanel({ goals, selectedGoal, onSelectGoal, study, scope, onScopeChange, navigation, mobile, density, onDensityChange }: {
  goals: Goal[]; selectedGoal: Goal; onSelectGoal: (id: string) => void;
  study: GoalViewStudySession; scope: SessionScope; onScopeChange: (scope: SessionScope) => void;
  navigation: ReturnType<typeof useWeaveNavigation>; mobile: boolean;
  density: "roomy" | "compact"; onDensityChange: (density: "roomy" | "compact") => void;
}) {
  const sessions = sessionsForGoal(study.state.sessions, selectedGoal.id, scope);
  const next = sessionsForGoal(study.state.sessions, selectedGoal.id, "upcoming").find(s => !isDone(s, study.state.facts));
  const lastSaved = sessionsForGoal(study.state.saved, selectedGoal.id, "all").at(-1);
  return <section className="gw-panel" aria-label="Time Weave in Goal View">
    <div className="gw-goal-context">
      <GoalCard goal={selectedGoal} interactive={!mobile} />
      <div className="gw-goal-facts">
        <p className="gv-overline">Selected goal</p><h2 className="gv-display">{selectedGoal.title}</h2>
        <GoalMetadata goal={selectedGoal} study={study} />
        <p className="gv-muted">{sessions.length} {scope === "history" ? "past" : scope === "upcoming" ? "upcoming" : "scheduled"} sessions</p>
        {next && <button className="gv-text-button" onClick={() => { if (scope === "history") onScopeChange("upcoming"); navigation.navigate(next.date); }}>Next session · {dateLabel(next.date, "MMM d")}<ArrowRight size={14} /></button>}
        {lastSaved && <button className="gv-text-button" onClick={() => { if ((scope === "history" && lastSaved.date >= SAMPLE_TODAY) || (scope === "upcoming" && lastSaved.date < SAMPLE_TODAY)) onScopeChange("all"); navigation.navigate(lastSaved.date); }}>Saved through {dateLabel(lastSaved.date, "MMM d, yyyy")}</button>}
      </div>
    </div>
    <div className="gw-schedule">
      <div className="gw-schedule-heading"><div><p className="gv-overline">{dateLabel(navigation.visibleDate, "MMMM yyyy")}</p><h2 className="gv-display">Your goals, over time.</h2></div>
        <div className="tw-period-controls">
          <button className="gv-icon-button" aria-label="Earlier dates" disabled={navigation.visibleDate <= AXIS_START} onClick={() => navigation.navigate(shiftDate(navigation.visibleDate, -28))}><ArrowLeft size={17} /></button>
          <button className="gv-button" onClick={() => navigation.navigate(SAMPLE_TODAY)}>Today</button>
          <button className="gv-icon-button" aria-label="Later dates" disabled={navigation.visibleDate >= AXIS_END} onClick={() => navigation.navigate(shiftDate(navigation.visibleDate, 28))}><ArrowRight size={17} /></button>
        </div>
      </div>
      <div className="gw-axis-controls">
        <label className="tw-jump"><CalendarDays size={14} /><span>Jump to</span><input aria-label="Jump to scheduled dates" type="date" min={AXIS_START} max={AXIS_END} value={navigation.selectedDate} onChange={e => { const input = e.currentTarget; if (input.value && input.validity.valid) navigation.navigate(input.value); }} /></label>
        <div className="gv-segmented" role="group" aria-label="Goal timeline density"><button aria-pressed={density === "roomy"} onClick={() => onDensityChange("roomy")}>Roomy</button><button aria-pressed={density === "compact"} onClick={() => onDensityChange("compact")}>Compact</button></div>
      </div>
      <WeaveTimeline goals={goals} study={study} scope={scope} selectedGoalId={selectedGoal.id} selectedDate={navigation.selectedDate} onSelectDate={navigation.inspect} requestedDate={navigation.requestedDate} dayWidth={density === "compact" ? 88 : mobile ? 112 : 140} labelWidth={mobile ? 116 : 160} onVisibleDate={navigation.setVisibleDate} onFocusGoal={onSelectGoal} />
      <p className="gw-saved-boundary">{selectedGoal.frequency_type === "fixed_milestones" ? "Milestones stay in order when moved." : selectedGoal.end_date ? `Recurring sessions are scheduled within the goal’s dates, ending ${dateLabel(selectedGoal.end_date, "MMM d")}.` : "Ongoing goals continue beyond their saved dates."} Select a goal row to inspect its card; the shared dates stay in place.</p>
    </div>
  </section>;
}
