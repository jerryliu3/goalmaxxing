"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import { cn } from "@/lib/utils";
import { GoalViewCard } from "./goal-view-card";

/** Delay that lets swipe momentum settle before the selection follows it. */
const SWIPE_SETTLE_MS = 140;

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
  const track = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [turningGoalId, setTurningGoalId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const index = Math.max(0, goals.findIndex((goal) => goal.id === selectedId));
  const turning = !reduceMotion && turningGoalId === selectedId;

  useEffect(() => {
    // A goal change or motion preference change ends this temporary gesture mode.
    setTurningGoalId(null);
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, [selectedId, reduceMotion]);

  useEffect(() => {
    const container = track.current;
    const card = container?.children[index] as HTMLElement | undefined;
    if (container && card) {
      container.scrollTo({
        left: card.offsetLeft - (container.clientWidth - card.clientWidth) / 2,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
  }, [index, reduceMotion, goals.length]);
  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    []
  );

  const handleScroll = () => {
    const container = track.current;
    if (!container || turning || !container.children.length) return;
    const center = container.scrollLeft + container.clientWidth / 2;
    const distanceToCenter = (node: HTMLElement) =>
      Math.abs(node.offsetLeft + node.clientWidth / 2 - center);
    const nearest = Array.from(container.children as HTMLCollectionOf<HTMLElement>)
      .map((node, nodeIndex) => ({ nodeIndex, distance: distanceToCenter(node) }))
      .reduce((best, candidate) => (candidate.distance < best.distance ? candidate : best));
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const goal = goals[nearest.nodeIndex];
      if (goal && goal.id !== selectedId) onSelect(goal.id);
    }, SWIPE_SETTLE_MS);
  };

  const toggleTurning = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    const container = track.current;
    const card = container?.children[index] as HTMLElement | undefined;
    if (container && card) {
      // Stop any swipe momentum and center the card before handing it the drag.
      container.scrollTo({
        left: card.offsetLeft - (container.clientWidth - card.clientWidth) / 2,
        behavior: "auto",
      });
    }
    setTurningGoalId(turning ? null : selectedId);
  };

  return (
    <div className="space-y-1">
      <div
        ref={track}
        tabIndex={0}
        aria-label={turning ? "Turn the selected goal card" : "Swipe between goal cards"}
        onScroll={handleScroll}
        className={cn(
          "relative flex items-center gap-6 overscroll-x-contain px-[15%] py-4 [scrollbar-width:none]",
          turning ? "overflow-x-hidden" : "snap-x snap-proximity overflow-x-auto"
        )}
      >
        {goals.map((goal) => (
          <div
            key={goal.id}
            data-selected={goal.id === selectedId}
            className={cn(
              "flex-[0_0_100%] snap-center opacity-60 transition-opacity motion-reduce:transition-none",
              goal.id === selectedId && "opacity-100"
            )}
          >
            <GoalViewCard
              goal={goal}
              progress={progressByGoalId.get(goal.id)}
              interactive={turning && goal.id === selectedId}
            />
          </div>
        ))}
      </div>
      {!reduceMotion ? (
        <div className="flex flex-col items-center gap-1 text-center">
          <button
            type="button"
            aria-pressed={turning}
            onClick={toggleTurning}
            className="min-h-11 rounded-lg px-3 text-xs font-medium text-muted-foreground underline underline-offset-4 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            {turning ? "Done turning" : "Turn card"}
          </button>
          <p className="text-[11px] text-muted-foreground" aria-live="polite">
            {turning ? "Drag the card to turn it." : "Swipe to change goals."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
