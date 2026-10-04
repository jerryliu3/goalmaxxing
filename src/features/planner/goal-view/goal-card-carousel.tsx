"use client";

import { type PointerEvent } from "react";
import { useReducedMotion } from "motion/react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import { cn } from "@/lib/utils";
import { GoalViewCard } from "./goal-view-card";
import { GoalDotScrollbar } from "./goal-dot-scrollbar";
import { useGoalCarouselScroll } from "./use-goal-carousel-scroll";

/**
 * Horizontally swipeable goal cards. Swiping selects the card it lands on;
 * selecting from elsewhere (arrows, dots) centers that card.
 */
export function GoalCardCarousel({
  goals,
  selectedId,
  onSelect,
  progressByGoalId,
}: {
  goals: Goal[];
  selectedId: string;
  onSelect: (goalId: string) => void;
  progressByGoalId: ReadonlyMap<string, ProgressContextSummary>;
}) {
  const reduceMotion = useReducedMotion();
  const scroll = useGoalCarouselScroll(goals, selectedId, onSelect, Boolean(reduceMotion));
  const previewIndex = Math.round(scroll.position);

  const holdCard = (event: PointerEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element) || event.button !== 0 || event.isPrimary === false) return;
    if (!event.target.closest('[data-rotatable="true"] [data-card-object]')) return;
    scroll.holdCard();
  };

  return (
    <div className="space-y-1">
      <div
        ref={scroll.track}
        tabIndex={0}
        aria-label="Swipe between goal cards"
        onScroll={scroll.onScroll}
        onPointerDownCapture={holdCard}
        onPointerUpCapture={scroll.releaseCard}
        onPointerCancelCapture={scroll.releaseCard}
        onLostPointerCapture={scroll.releaseCard}
        className="relative flex items-center gap-6 snap-x snap-proximity overflow-x-auto overscroll-x-contain px-[15%] py-4 [scrollbar-width:none]"
      >
        {goals.map((goal, index) => (
          <div
            key={goal.id}
            data-selected={index === previewIndex}
            className={cn(
              "flex-[0_0_100%] snap-center opacity-60 transition-opacity motion-reduce:transition-none",
              index === previewIndex && "opacity-100"
            )}
          >
            <GoalViewCard
              goal={goal}
              progress={progressByGoalId.get(goal.id)}
            />
          </div>
        ))}
      </div>
      <GoalDotScrollbar
        goals={goals}
        position={scroll.position}
        onSeek={scroll.seek}
        onStart={scroll.beginScrub}
        onEnd={scroll.endScrub}
      />
    </div>
  );
}
