"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import { GoalCardCarousel } from "./goal-card-carousel";
import {
  GoalDates,
  GoalDatesHeading,
  overlineClass,
  useGoalDates,
  type GoalTileRenderer,
} from "./goal-dates";
import { sessionsForGoal, type GoalViewSession } from "./goal-view-model";

const iconButtonClass =
  "grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30";

/**
 * Phone arrangement: goal cards swipe horizontally, and the selected goal's
 * dates sit below as a vertical list.
 */
export function GoalDeck({
  goals,
  selectedId,
  onSelect,
  progressByGoalId,
  sessions,
  showPast,
  weekStartsOn,
  today,
  renderTile,
}: {
  goals: Goal[];
  selectedId: string;
  onSelect: (goalId: string) => void;
  progressByGoalId: ReadonlyMap<string, ProgressContextSummary>;
  /** Every session; the deck scopes them to the selected goal. */
  sessions: GoalViewSession[];
  showPast: boolean;
  weekStartsOn: number;
  today: string;
  renderTile: GoalTileRenderer;
}) {
  const index = Math.max(0, goals.findIndex((goal) => goal.id === selectedId));
  const selected = goals[index];

  return (
    <div className="space-y-2" data-testid="goal-deck">
      <div className="flex items-center justify-between pt-1">
        <span className={overlineClass}>
          Goal {index + 1} of {goals.length}
        </span>
        <div className="flex">
          <button
            type="button"
            aria-label="Previous goal"
            disabled={index === 0}
            onClick={() => onSelect(goals[index - 1].id)}
            className={iconButtonClass}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next goal"
            disabled={index === goals.length - 1}
            onClick={() => onSelect(goals[index + 1].id)}
            className={iconButtonClass}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <GoalCardCarousel
        goals={goals}
        selectedId={selected.id}
        onSelect={onSelect}
        progressByGoalId={progressByGoalId}
      />
      <SelectedGoalDates
        // A new goal starts back on its first page of dates.
        key={selected.id}
        goal={selected}
        sessions={sessionsForGoal(sessions, selected.id, showPast, today)}
        showPast={showPast}
        weekStartsOn={weekStartsOn}
        today={today}
        renderTile={renderTile}
      />
    </div>
  );
}

function SelectedGoalDates({
  goal,
  sessions,
  showPast,
  weekStartsOn,
  today,
  renderTile,
}: {
  goal: Goal;
  sessions: GoalViewSession[];
  showPast: boolean;
  weekStartsOn: number;
  today: string;
  renderTile: GoalTileRenderer;
}) {
  const dates = useGoalDates({ sessions, weekStartsOn, today });
  return (
    <section aria-label={`${goal.title} scheduled dates`} className="space-y-4 pt-3">
      <GoalDatesHeading goal={goal} showPast={showPast} dates={dates} />
      <div className="flex flex-col gap-4">
        <GoalDates
          dates={dates}
          layout="row"
          renderTile={renderTile}
        />
      </div>
    </section>
  );
}
