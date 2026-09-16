"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { PlannerCalendarViewMode } from "@/features/planner/calendar-surface.types";

const PINCH_IN_SCALE = 0.82;
const PINCH_OUT_SCALE = 1.18;

export function nextViewModeAfterPinch(
  current: PlannerCalendarViewMode,
  direction: "in" | "out"
): PlannerCalendarViewMode | null {
  if (direction === "in") {
    if (current === "day") {
      return "week";
    }
    if (current === "week" || current === "three_day") {
      return "month";
    }
    return null;
  }

  if (current === "month") {
    return "week";
  }
  if (current === "week" || current === "three_day") {
    return "day";
  }
  return null;
}

function touchDistance(touches: TouchList) {
  if (touches.length < 2) {
    return 0;
  }
  const first = touches[0];
  const second = touches[1];
  const dx = first.clientX - second.clientX;
  const dy = first.clientY - second.clientY;
  return Math.hypot(dx, dy);
}

export function usePlanPinchViewChange({
  containerRef,
  viewMode,
  onViewModeChange,
  disabled = false,
}: {
  containerRef: RefObject<HTMLElement | null>;
  viewMode: PlannerCalendarViewMode;
  onViewModeChange: (mode: PlannerCalendarViewMode) => void;
  disabled?: boolean;
}) {
  const startDistanceRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || disabled) {
      return;
    }

    const onTouchMove = (event: TouchEvent) => {
      if (
        event.touches.length !== 2 ||
        startDistanceRef.current === null ||
        firedRef.current
      ) {
        return;
      }

      event.preventDefault();
      const scale = touchDistance(event.touches) / startDistanceRef.current;
      const direction =
        scale <= PINCH_IN_SCALE ? "in" : scale >= PINCH_OUT_SCALE ? "out" : null;
      if (!direction) {
        return;
      }

      const nextMode = nextViewModeAfterPinch(viewMode, direction);
      if (!nextMode || nextMode === viewMode) {
        firedRef.current = true;
        return;
      }

      firedRef.current = true;
      onViewModeChange(nextMode);
    };

    // A non-passive `touchmove` listener forces the browser to wait on this
    // handler before it can scroll, which stalls one-finger scrolling through
    // the board (the day checklist lives inside it). Keep it attached only
    // while a real two-finger gesture is in flight. Re-adding the same
    // callback is a no-op per the DOM spec, as is removing one that is not
    // attached, so the pair needs no bookkeeping of its own.
    const endGesture = () => {
      startDistanceRef.current = null;
      firedRef.current = false;
      node.removeEventListener("touchmove", onTouchMove);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) {
        endGesture();
        return;
      }
      startDistanceRef.current = touchDistance(event.touches);
      firedRef.current = false;
      node.addEventListener("touchmove", onTouchMove, { passive: false });
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) {
        endGesture();
      }
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchend", onTouchEnd, { passive: true });
    node.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("touchcancel", onTouchEnd);
      node.removeEventListener("touchmove", onTouchMove);
    };
  }, [containerRef, disabled, onViewModeChange, viewMode]);
}
