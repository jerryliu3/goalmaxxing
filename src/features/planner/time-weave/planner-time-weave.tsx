"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { PlannerDroppableDay } from "@/features/planner/calendar-dnd";
import type { Goal } from "@/lib/goals/types";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { GoalViewSession } from "@/features/planner/goal-view/goal-view-model";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { OptimisticCompletionFacts } from "@/lib/planner/optimistic-completion-facts";
import { dateLabel, selectGoalViewGoals } from "@/features/planner/goal-view/goal-view-model";
import { resolveGoalSessionCompletion } from "@/features/planner/goal-view/goal-session-completion";
import { addDaysToDateString, startOfWeekDateString } from "@/lib/goals/periods";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import { useMediaQuery } from "@/lib/ui/use-media-query";
import { isDemoPathname } from "@/lib/navigation/demo-path";
import { timelineIndex } from "./timeline-axis";
import { useTimelineAxis } from "./use-timeline-axis";
import { TimelineSession } from "./timeline-session";
import styles from "./time-weave.module.css";

export interface PlannerTimeWeaveProps {
  goals: Goal[];
  sessions: GoalViewSession[];
  today: string;
  weekStartsOn: number | null | undefined;
  loading: boolean;
  showCompletedGoals: boolean;
  completedGoalIds: ReadonlySet<string>;
  progressSummaries: ProgressContextSummary[];
  canMutatePlanItems: boolean;
  optimisticCompletionFacts: OptimisticCompletionFacts;
  mutationLoadingKey: string | null;
  canOpenEntry: (entry: PlannerDayDetailEntry) => boolean;
  canMutateEntryOnDay: (entry: PlannerDayDetailEntry, date: string) => boolean;
  onMoveEntry: (entry: PlannerDayDetailEntry, date: string) => void;
  onToggleEntry: (entry: PlannerDayDetailEntry, date: string, source: HTMLButtonElement) => void;
  onVisibleDate: (date: string) => void;
  onInspectDate: (date: string) => void;
  onOpenEntry: (entry: PlannerDayDetailEntry, date: string) => void;
}

export function PlannerTimeWeave({ goals, sessions, today, weekStartsOn, loading, showCompletedGoals,
  completedGoalIds, progressSummaries, canMutatePlanItems, optimisticCompletionFacts, mutationLoadingKey,
  canOpenEntry, canMutateEntryOnDay, onMoveEntry, onToggleEntry, onVisibleDate, onInspectDate, onOpenEntry,
}: PlannerTimeWeaveProps) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const dayWidth = desktop ? 144 : 120;
  const labelWidth = desktop ? 184 : 116;
  const weekStart = startOfWeekDateString(today, normalizeWeekStartsOn(weekStartsOn));
  const [leadingDate, setLeadingDate] = useState(weekStart);
  const [focusedGoalId, setFocusedGoalId] = useState<string | null>(null);
  const prefix = isDemoPathname(usePathname()) ? "/demo" : "";
  const axis = useTimelineAxis(weekStart, dayWidth, labelWidth, (date) => {
    setLeadingDate(date);
    onVisibleDate(date);
  });
  const dates = useMemo(() => Array.from({ length: axis.range.last - axis.range.first + 1 }, (_, offset) => {
    const index = axis.range.first + offset;
    return { index, date: addDaysToDateString(axis.span.start, index) };
  }), [axis.range.first, axis.range.last, axis.span.start]);
  const rows = useMemo(() => {
    const visibleGoals = selectGoalViewGoals(goals, sessions, { showPast: true, today })
      .filter((goal) => showCompletedGoals || !completedGoalIds.has(goal.id) || sessions.some((session) => session.goalId === goal.id && session.date >= today));
    return visibleGoals.map((goal) => {
      const counts = new Map<string, number>();
      const entries = sessions.filter((session) => session.goalId === goal.id).map((session) => {
        const slot = counts.get(session.date) ?? 0;
        counts.set(session.date, slot + 1);
        return { session, slot };
      });
      return { goal, entries, height: Math.max(120, ...Array.from(counts.values(), (count) => count * 106 + 14)) };
    });
  }, [completedGoalIds, goals, sessions, showCompletedGoals, today]);
  const progressByGoal = useMemo(() => new Map(progressSummaries.map((summary) => [summary.goalId, summary])), [progressSummaries]);
  const laneWidth = axis.span.days * dayWidth;
  const contentHeight = rows.reduce((total, row) => total + row.height, 0);

  return (
    <div className="space-y-3" data-testid="agenda-time-weave">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-sm font-medium">Goals across time</p><p className="text-xs text-muted-foreground">Scroll across dates. Arrange sessions, then save your plan.</p></div>
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="outline" aria-label="Earlier dates" onClick={() => axis.scrollToDate(addDaysToDateString(leadingDate, -28))}><ArrowLeft /></Button>
          <Button size="sm" variant="outline" onClick={() => axis.scrollToDate(weekStart)}>This week</Button>
          <Button size="icon-sm" variant="outline" aria-label="Later dates" onClick={() => axis.scrollToDate(addDaysToDateString(leadingDate, 28))}><ArrowRight /></Button>
          <DateField aria-label="Jump to scheduled date" value={leadingDate} onValueChange={(date) => { if (date) axis.scrollToDate(date); }} className="h-8 max-w-36 rounded-md border border-input bg-background px-2 text-xs" />
        </div>
      </div>
      <div className={styles.viewport} ref={axis.ref} role="region" tabIndex={0}
        aria-label="Goal View timeline, scroll across dates" aria-busy={loading}>
        <div className={styles.canvas} style={{ width: labelWidth + laneWidth }}>
          <div className={styles.header}>
            <div className={styles.corner} style={{ width: labelWidth }}><strong>Goals × time</strong><small>{dateLabel(leadingDate, "MMM yyyy")}</small></div>
            <div className={styles.axis} style={{ width: laneWidth }}>
              {dates.map(({ index, date }) => (
                <button key={date} className={styles.day} data-today={date === today}
                  style={{ left: index * dayWidth, width: dayWidth }} disabled={loading}
                  aria-label={`Inspect ${dateLabel(date, "EEEE, MMMM d, yyyy")}`} onClick={() => onInspectDate(date)}>
                  <span>{startOfWeekDateString(date, normalizeWeekStartsOn(weekStartsOn)) === date ? "Week of " + dateLabel(date, "MMM d") : ""}</span>
                  <small>{dateLabel(date, "EEE")}</small><strong>{dateLabel(date, "d")}</strong><small>{dateLabel(date, "MMM yyyy")}</small>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.dropLayer} style={{ left: labelWidth, width: laneWidth, height: contentHeight }} aria-hidden>
            {dates.map(({ index, date }) => (
              <PlannerDroppableDay key={date} day={date}>{({ setNodeRef, isOver }) => (
                <div ref={setNodeRef} className={styles.dropDay} data-over={isOver} data-today={date === today} style={{ left: index * dayWidth, width: dayWidth }} />
              )}</PlannerDroppableDay>
            ))}
          </div>
          {rows.map(({ goal, entries, height }) => (
            <section key={goal.id} className={styles.row} aria-label={`${goal.title} timeline`} style={{ height }}>
              <button className={styles.label} style={{ width: labelWidth, borderLeftColor: goal.color ?? undefined }} aria-pressed={focusedGoalId === goal.id}
                onClick={() => setFocusedGoalId((current) => current === goal.id ? null : goal.id)}>
                <strong>{goal.title}</strong><small>{progressByGoal.get(goal.id)?.creditedUnitCount ?? 0} completions</small><small>{goal.end_date ? `Through ${dateLabel(goal.end_date, "MMM d, yyyy")}` : "Ongoing"}</small>
              </button>
              <div className={styles.lane} data-muted={Boolean(focusedGoalId && focusedGoalId !== goal.id)} style={{ width: laneWidth }}>
                {entries.filter(({ session }) => {
                  const index = timelineIndex(session.date, axis.span.start);
                  return index >= axis.range.first && index <= axis.range.last;
                }).map(({ session, slot }) => (
                  <TimelineSession key={session.key} session={session} today={today} loading={loading} openable={canOpenEntry(session.entry)}
                    left={timelineIndex(session.date, axis.span.start) * dayWidth + 6} top={slot * 106 + 8} width={dayWidth - 12}
                    completion={resolveGoalSessionCompletion({ session, asOfDate: today, canMutatePlanItems, optimisticCompletionFacts, mutationLoadingKey })}
                    editable={canOpenEntry(session.entry) && canMutateEntryOnDay(session.entry, session.date)}
                    onOpen={() => onOpenEntry(session.entry, session.date)}
                    onMove={(date) => onMoveEntry(session.entry, date)}
                    onToggle={(source) => { if (canMutateEntryOnDay(session.entry, session.date)) onToggleEntry(session.entry, session.date, source); }} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>{loading ? "Loading saved sessions…" : "Empty dates have no saved sessions. Browsing does not extend your plan."}</span>
        <span>Select a date to inspect the day · use a session’s date control or drag handle to move it.</span>
      </div>
      {!loading && rows.length === 0 ? <p className="text-sm text-muted-foreground">No scheduled goals in this window. <Link href={`${prefix}/goals`} className="underline">Open Goals</Link> to review your goals.</p> : null}
    </div>
  );
}
