"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Goal } from "@/lib/goals/types";

const SWIPE_SETTLE_MS = 140;

/** Native scrolling and the dotted slider share one position and selection path. */
export function useGoalCarouselScroll(goals: Goal[], selectedId: string, onSelect: (id: string) => void, reduced: boolean) {
  const track = useRef<HTMLDivElement>(null);
  const index = Math.max(0, goals.findIndex(goal => goal.id === selectedId));
  const [position, setPosition] = useState(index);
  const [moving, setMoving] = useState(false);
  const frame = useRef<number | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekPosition = useRef<number | null>(null);
  const scrubbing = useRef(false);
  const cardHeld = useRef(false);

  const clamp = useCallback((value: number) => Math.max(0, Math.min(goals.length - 1, value)), [goals.length]);
  const geometry = useCallback(() => {
    const container = track.current;
    const first = container?.children[0] as HTMLElement | undefined;
    const second = container?.children[1] as HTMLElement | undefined;
    if (!container || !first) return null;
    return {
      container,
      start: first.offsetLeft - (container.clientWidth - first.clientWidth) / 2,
      step: second ? second.offsetLeft - first.offsetLeft : 0,
    };
  }, []);
  const readPosition = () => {
    const measured = geometry();
    return measured?.step ? clamp((measured.container.scrollLeft - measured.start) / measured.step) : 0;
  };
  const scrollTo = useCallback((value: number, behavior: ScrollBehavior) => {
    const measured = geometry();
    measured?.container.scrollTo({ left: measured.start + measured.step * clamp(value), behavior });
  }, [clamp, geometry]);
  const cancelPending = useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);
  const select = (value: number) => {
    const goal = goals[Math.round(clamp(value))];
    if (goal && goal.id !== selectedId) onSelect(goal.id);
  };
  const scheduleFrame = () => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const next = seekPosition.current ?? readPosition();
      if (seekPosition.current !== null) scrollTo(next, "auto");
      seekPosition.current = null;
      setPosition(next);
      if (settleTimer.current) clearTimeout(settleTimer.current);
      if (!scrubbing.current && !cardHeld.current) {
        settleTimer.current = setTimeout(() => { setMoving(false); select(next); }, SWIPE_SETTLE_MS);
      }
    });
  };

  useEffect(() => {
    cancelPending();
    seekPosition.current = null;
    cardHeld.current = false;
    setPosition(index);
    setMoving(true);
    settleTimer.current = setTimeout(() => setMoving(false), SWIPE_SETTLE_MS);
    if (!scrubbing.current) scrollTo(index, reduced ? "auto" : "smooth");
  }, [index, selectedId, goals.length, reduced, scrollTo, cancelPending]);
  useEffect(() => () => { cancelPending(); }, [cancelPending]);

  return {
    track,
    position,
    moving,
    onScroll: () => { if (!cardHeld.current) { setMoving(true); scheduleFrame(); } },
    seek: (value: number) => {
      setMoving(true);
      seekPosition.current = clamp(value);
      scheduleFrame();
    },
    beginScrub: () => {
      cancelPending();
      setMoving(true);
      scrubbing.current = true;
      if (track.current) track.current.style.scrollSnapType = "none";
    },
    endScrub: () => {
      const next = Math.round(seekPosition.current ?? readPosition());
      cancelPending();
      seekPosition.current = null;
      scrubbing.current = false;
      track.current?.style.removeProperty("scroll-snap-type");
      setPosition(next);
      scrollTo(next, reduced ? "auto" : "smooth");
      select(next);
      scheduleFrame();
    },
    holdCard: () => {
      cancelPending();
      cardHeld.current = true;
      const container = track.current;
      container?.scrollTo({ left: container.scrollLeft, behavior: "auto" });
    },
    releaseCard: () => { cardHeld.current = false; },
  };
}
