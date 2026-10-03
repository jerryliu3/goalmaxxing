"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import {
  GoalDates,
  GoalDatesHeading,
  useGoalDates,
  type GoalTileRenderer,
} from "./goal-dates";
import { GoalViewCard } from "./goal-view-card";
import type { GoalViewSession } from "./goal-view-model";

const SCROLL_STEP = 350;
const iconButtonClass =
  "grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30";

/** One goal: its material card beside a horizontal track of scheduled dates. */
export function GoalRail({
  goal,
  progress,
  sessions,
  showPast,
  weekStartsOn,
  today,
  renderTile,
}: {
  goal: Goal;
  progress: ProgressContextSummary | undefined;
  /** Already scoped to this goal and sorted by date. */
  sessions: GoalViewSession[];
  showPast: boolean;
  weekStartsOn: number;
  today: string;
  renderTile: GoalTileRenderer;
}) {
  const track = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const dates = useGoalDates({ sessions, weekStartsOn, today });
  const scroll = (left: number) =>
    track.current?.scrollBy({ left, behavior: reduceMotion ? "auto" : "smooth" });

  // Showing past sessions adds them before today's; keep the upcoming ones in view.
  useEffect(() => {
    const container = track.current;
    const start = container?.querySelector<HTMLElement>("[data-upcoming-start]");
    if (!container || !start) return;
    container.scrollLeft =
      start.getBoundingClientRect().left -
      container.getBoundingClientRect().left +
      container.scrollLeft;
  }, [showPast]);

  return (
    <section
      aria-label={`${goal.title} scheduled dates`}
      className="grid min-w-0 grid-cols-[210px_minmax(0,1fr)] items-center gap-x-8 border-b border-border py-7"
    >
      <GoalViewCard goal={goal} progress={progress} />
      <div className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <GoalDatesHeading goal={goal} showPast={showPast} dates={dates} />
          <div className="flex gap-0.5">
            <button
              type="button"
              aria-label={`Earlier ${goal.title} sessions`}
              onClick={() => scroll(-SCROLL_STEP)}
              className={iconButtonClass}
            >
              <ArrowLeft size={17} />
            </button>
            <button
              type="button"
              aria-label={`Later ${goal.title} sessions`}
              onClick={() => scroll(SCROLL_STEP)}
              className={iconButtonClass}
            >
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
        <div
          ref={track}
          tabIndex={0}
          data-plan-scroll-clip="true"
          aria-label={`${goal.title} dates, scroll to explore`}
          className="flex gap-5 overflow-x-auto overscroll-x-contain pb-3"
        >
          <GoalDates
            dates={dates}
            layout="card"
            renderTile={renderTile}
          />
        </div>
      </div>
    </section>
  );
}
