"use client";

import { useEffect, useRef, type PointerEvent } from "react";
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
  const cardPointerId = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const index = Math.max(0, goals.findIndex((goal) => goal.id === selectedId));

  useEffect(() => {
    cardPointerId.current = null;
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
    if (!container || cardPointerId.current !== null || !container.children.length) return;
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

  const holdCard = (event: PointerEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element) || event.button !== 0 || event.isPrimary === false) return;
    if (!event.target.closest('[data-rotatable="true"] [data-card-object]')) return;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    cardPointerId.current = event.pointerId;
    const container = track.current;
    // Stop swipe momentum without moving the card under the user's finger.
    container?.scrollTo({ left: container.scrollLeft, behavior: "auto" });
  };
  const releaseCard = () => { cardPointerId.current = null; };

  return (
    <div className="space-y-1">
      <div
        ref={track}
        tabIndex={0}
        aria-label="Swipe between goal cards"
        onScroll={handleScroll}
        onPointerDownCapture={holdCard}
        onPointerUpCapture={releaseCard}
        onPointerCancelCapture={releaseCard}
        onLostPointerCapture={releaseCard}
        className="relative flex items-center gap-6 snap-x snap-proximity overflow-x-auto overscroll-x-contain px-[15%] py-4 [scrollbar-width:none]"
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
            />
          </div>
        ))}
      </div>
    </div>
  );
}
