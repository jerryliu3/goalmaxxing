"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Infinity as InfinityIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { goalCardFields } from "@/features/goals/goal-card-fields";
import type { Goal } from "@/lib/goals/types";
import { dateLabel, goalProgress, groupSessions, sessionsForGoal, type SessionGrouping, type SessionScope } from "./model";
import { SAMPLE_THROUGH, SAMPLE_TODAY } from "./sample";
import { SessionTile } from "./session-tile";
import type { GoalViewStudySession } from "./use-study";

export function GoalCard({ goal, interactive = true }: { goal: Goal; interactive?: boolean }) {
  return <div className="gv-real-card"><TempoGoalCard fields={goalCardFields(goal)} context="history" rotatable={interactive} /></div>;
}

export function GoalMetadata({ goal, study }: { goal: Goal; study: GoalViewStudySession }) {
  const progress = goalProgress(goal, study.state.facts);
  return <div className="gv-goal-metadata">
    <div className="gv-progress-label"><strong>{progress.done} <span>/ {progress.target}</span></strong><span>{progress.unit}</span></div>
    <div role="progressbar" aria-label={`${goal.title} progress`} aria-valuemin={0} aria-valuemax={progress.target} aria-valuenow={Math.min(progress.done, progress.target)} aria-valuetext={progress.label} className="gv-progress"><span style={{ width: `${Math.min(1, progress.done / progress.target) * 100}%` }} /></div>
    <p>{goal.end_date ? <>Ends {dateLabel(goal.end_date, "MMM d, yyyy")}</> : <><InfinityIcon size={14} />Ongoing · no end date</>}</p>
  </div>;
}

export function GoalPanel({ goal, study, scope, grouping, focused = false, hideCard = false }: { goal: Goal; study: GoalViewStudySession; scope: SessionScope; grouping: SessionGrouping; focused?: boolean; hideCard?: boolean }) {
  const [limit, setLimit] = useState(12);
  const rail = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const all = sessionsForGoal(study.state.sessions, goal.id, scope);
  const visible = all.slice(0, limit);
  const groups = groupSessions(visible, grouping);
  const first = all[0];
  const last = sessionsForGoal(study.state.sessions, goal.id, "all").at(-1);
  return <section className={`gv-goal-panel ${focused ? "gv-focused-panel" : ""} ${hideCard ? "gv-without-card" : ""}`} aria-label={`${goal.title} scheduled dates`}>
    {!hideCard && <div className="gv-goal-object"><GoalCard goal={goal} /><GoalMetadata goal={goal} study={study} /></div>}
    <div className="gv-goal-dates">
      <div className="gv-track-heading">
        <div><h2>{hideCard ? goal.title : focused ? "Your scheduled dates" : "Scheduled dates"}</h2><p className="gv-muted">{all.length} {scope === "all" ? "saved" : scope === "history" ? "past" : "upcoming"} sessions{first && scope !== "history" ? ` · next ${dateLabel(first.date, "EEE, MMM d")}` : ""}</p></div>
        <div className="gv-track-controls">
          <button className="gv-icon-button" aria-label={`See ${goal.title} in calendar`} title="See this week" onClick={() => study.setCalendarDate(first?.date ?? SAMPLE_TODAY)}><CalendarDays size={17} /></button>
          {!focused && <><button className="gv-icon-button gv-rail-arrow" aria-label={`Earlier ${goal.title} sessions`} onClick={() => rail.current?.scrollBy({ left: -350, behavior: still ? "instant" : "smooth" })}><ArrowLeft size={17} /></button><button className="gv-icon-button gv-rail-arrow" aria-label={`Later ${goal.title} sessions`} onClick={() => rail.current?.scrollBy({ left: 350, behavior: still ? "instant" : "smooth" })}><ArrowRight size={17} /></button></>}
        </div>
      </div>
      {focused && <p className="gv-goal-description">{goal.description}</p>}
      <div ref={rail} className="gv-session-track" tabIndex={0} aria-label={`${goal.title} dates, scroll to explore`}>
        {groups.map(group => <div className="gv-session-group" key={group.date}><h3 className="gv-overline">{group.label}</h3><div className="gv-session-group-items">{group.entries.map(s => <SessionTile key={s.id} session={s} study={study} />)}</div></div>)}
        {!all.length && <p className="gv-empty">No {scope === "history" ? "past" : "upcoming"} scheduled dates in this sample. Try All dates.</p>}
        {all.length > limit && <button className="gv-load-dates" onClick={() => setLimit(current => current + 12)}><ArrowRight size={19} /><strong>More dates</strong><span>{all.length - limit} still to explore</span></button>}
      </div>
      <div className="gv-track-footer"><span>{goal.end_date ? `${goal.target_count} ${goal.frequency_type === "fixed_milestones" ? "milestones in order" : `days per ${goal.recurrence_interval === "weekly" ? "week" : "month"}`}` : "The practice continues beyond these dates."}</span><span>Plan saved through {dateLabel(last?.date ?? SAMPLE_THROUGH, "MMM d")}</span></div>
    </div>
  </section>;
}
