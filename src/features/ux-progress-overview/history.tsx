"use client";

import { format, parseISO } from "date-fns";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Button } from "@/components/ui/button";
import { InsightsPeriodControls } from "@/features/insights/insights-period-controls";
import { MonthHeatmap } from "@/features/insights/month-heatmap";
import { ProgressMilestoneRunway } from "@/features/insights/progress-milestone-runway";
import { getHeatmapScaleClass } from "@/lib/goals/heatmap";
import { historyCounts, selectedFacts } from "./model";
import { ACTIVE_GOALS, AS_OF, MILESTONES } from "./seed";

export interface HistoryState {
  month: Date;
  scale: "month" | "year";
  ids: string[];
  compare: boolean;
  day: string | null;
}
export function initialHistory(): HistoryState {
  return { month: new Date(2026, 8, 1), scale: "month", ids: ACTIVE_GOALS.map(goal => goal.id), compare: false, day: null };
}

export function ProgressHistory({ state, onChange }: {
  state: HistoryState;
  onChange: (next: HistoryState) => void;
}) {
  const counts = historyCounts(state.ids);
  const focusedGoal = state.ids.length === 1 ? ACTIVE_GOALS.find(goal => goal.id === state.ids[0]) : null;
  const facts = selectedFacts(state.ids).filter(fact => fact.completed_on === state.day);
  const year = state.month.getFullYear();
  const selectDay = (day: string) => {
    if (day <= AS_OF) onChange({ ...state, day });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Completion history, including unscheduled work. Sample records are read-only.</p>
        <InsightsPeriodControls
          monthCursor={state.month} onMonthCursorChange={month => onChange({ ...state, month, day: null })}
          perGoalViewMode={state.scale} onPerGoalViewModeChange={scale => onChange({ ...state, scale, day: null })}
          viewModeSelectId="prototype-history-scale"
        />
      </div>
      <div className="grid gap-6 md:grid-cols-[minmax(12rem,18rem)_minmax(0,1fr)]">
        <aside className="order-2 md:order-1" aria-label="Goal focus">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-xl">Goals</h2>
            <Button variant="ghost" size="sm" aria-pressed={state.compare} onClick={() => onChange({ ...state, compare: !state.compare })}>
              {state.compare ? "Done comparing" : "Compare"}
            </Button>
          </div>
          <Button variant="outline" className="mb-3 w-full" onClick={() => onChange({ ...state, ids: ACTIVE_GOALS.map(goal => goal.id), day: null })}>All goals</Button>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {ACTIVE_GOALS.map(goal => (
              <button key={goal.id} type="button" aria-pressed={state.ids.includes(goal.id)}
                className={`rounded-lg border p-3 text-left ${state.ids.includes(goal.id) ? "border-primary/40 bg-primary/10" : "border-border"}`}
                onClick={() => onChange({ ...state, day: null, ids: state.compare
                  ? state.ids.includes(goal.id) ? state.ids.filter(id => id !== goal.id) : [...state.ids, goal.id]
                  : [goal.id] })}>
                <span className="block font-display text-base">{goal.title}</span>
                <span className="text-xs text-muted-foreground">{goal.interval === "milestones" ? "3 / 6 lifetime milestones" : `${goal.days.length} in September`}</span>
              </button>
            ))}
          </div>
        </aside>
        <div className="order-1 min-w-0 space-y-3 md:order-2">
          <h2 className="font-display text-xl">{focusedGoal?.title ?? (state.ids.length === ACTIVE_GOALS.length ? "All goals" : `${state.ids.length} goals selected`)}</h2>
          {state.ids.length === 0 ? <p className="py-12 text-sm text-muted-foreground">Select a goal to see its history.</p> : state.scale === "month" ? (
            <MonthHeatmap month={state.month} countsByDate={counts} onDayClick={selectDay}
              isDayDisabled={day => day > AS_OF} milestoneDates={state.ids.includes("thesis") ? MILESTONES.flatMap(stop => stop.date ? [stop.date] : []) : []} />
          ) : (
            <CalendarHeatmap startDate={new Date(year, 0, 1)} endDate={new Date(year, 11, 31)}
              values={Object.entries(counts).filter(([date]) => date.startsWith(String(year))).map(([date, count]) => ({ date, count }))}
              classForValue={value => getHeatmapScaleClass(value?.count ?? 0)}
              titleForValue={value => `${value?.date ?? "No record"}: ${value?.count ?? 0} completions`}
              onClick={value => { if (value?.date) selectDay(value.date); }} />
          )}
          {state.day && (
            <section aria-label="Selected day" className="rounded-lg border border-border bg-card p-4" aria-live="polite">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg">{format(parseISO(state.day), "MMMM d, yyyy")}</h3>
                <Button variant="ghost" size="sm" onClick={() => onChange({ ...state, day: null })}>Close day</Button>
              </div>
              {facts.length ? <ul className="mt-3 space-y-2 text-sm">{facts.map(fact => <li key={fact.goal_id}>✓ {ACTIVE_GOALS.find(goal => goal.id === fact.goal_id)?.title}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No completions recorded.</p>}
            </section>
          )}
        </div>
      </div>
      {focusedGoal?.id === "thesis" && <ProgressMilestoneRunway title={focusedGoal.title} countLabel="3 / 6 lifetime milestones" stops={MILESTONES} activeDate={state.day}
        onSelect={stop => { if (stop.date) onChange({ ...state, month: parseISO(`${stop.date.slice(0, 7)}-01`), day: stop.date }); }} />}
    </div>
  );
}
