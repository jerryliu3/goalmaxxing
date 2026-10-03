"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import { cn } from "@/lib/utils";
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
  editorSlotKey,
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
  /** Session whose planner editor expands under its row, if listed here. */
  editorSlotKey: string | null;
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
      <div role="group" aria-label="Select goal" className="flex justify-center">
        {goals.map((goal, dotIndex) => (
          <button
            key={goal.id}
            type="button"
            aria-label={`Select ${goal.title}`}
            aria-pressed={dotIndex === index}
            onClick={() => onSelect(goal.id)}
            className="grid size-7 place-items-center"
          >
            <span
              className={cn(
                "h-1.5 rounded-full bg-border",
                dotIndex === index ? "w-4 bg-primary" : "w-1.5"
              )}
            />
          </button>
        ))}
      </div>
      <SelectedGoalDates
        // A new goal starts back on its first page of dates.
        key={selected.id}
        goal={selected}
        sessions={sessionsForGoal(sessions, selected.id, showPast, today)}
        showPast={showPast}
        weekStartsOn={weekStartsOn}
        today={today}
        editorSlotKey={editorSlotKey}
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
  editorSlotKey,
  renderTile,
}: {
  goal: Goal;
  sessions: GoalViewSession[];
  showPast: boolean;
  weekStartsOn: number;
  today: string;
  editorSlotKey: string | null;
  renderTile: GoalTileRenderer;
}) {
  const dates = useGoalDates({ sessions, weekStartsOn, today });
  return (
    <section aria-label={`${goal.title} scheduled dates`} className="space-y-4 pt-3">
      <GoalDatesHeading goal={goal} showPast={showPast} dates={dates} />
      <div className="flex flex-col gap-4">
        <GoalDates
          dates={dates}
          showPast={showPast}
          layout="row"
          editorSlotKey={editorSlotKey}
          renderTile={renderTile}
        />
      </div>
    </section>
  );
}
