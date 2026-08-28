"use client";

import { useEffect, useRef } from "react";
import type { DayPreviewState } from "@/features/planner/calendar-surface.types";

export function useCalendarSurfaceInteractionRefs() {
  const draftPolicyRef = useRef<import("@/lib/planner/policy").PlannerPolicy | null>(
    null
  );
  const hoverPreviewTimerRef = useRef<number | null>(null);
  const hoverPreviewCloseTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerPressActiveRef = useRef(false);
  const pointerInsideDayPreviewRef = useRef(false);
  const lastTouchTapRef = useRef<{ day: string; at: number } | null>(null);
  const suppressDayCellClickRef = useRef<{ day: string; active: boolean } | null>(
    null
  );
  const calendarPreparedRef = useRef(false);
  const skipInvalidationReloadRef = useRef(false);
  const dayPreviewRef = useRef<HTMLDivElement | null>(null);
  const rollingWeekStripRef = useRef<HTMLDivElement | null>(null);
  const calendarGridViewportRef = useRef<HTMLDivElement | null>(null);
  const multiMonthGridScrollRef = useRef<HTMLDivElement | null>(null);
  const monthScrollAlignmentKeyRef = useRef<string | null>(null);
  const calendarHorizontalAlignmentKeyRef = useRef<string | null>(null);

  return {
    draftPolicyRef,
    hoverPreviewTimerRef,
    hoverPreviewCloseTimerRef,
    longPressTimerRef,
    longPressTriggeredRef,
    pointerPressActiveRef,
    pointerInsideDayPreviewRef,
    lastTouchTapRef,
    suppressDayCellClickRef,
    calendarPreparedRef,
    skipInvalidationReloadRef,
    dayPreviewRef,
    rollingWeekStripRef,
    calendarGridViewportRef,
    multiMonthGridScrollRef,
    monthScrollAlignmentKeyRef,
    calendarHorizontalAlignmentKeyRef,
    isDayPreviewSurfaceTarget: (target: Element) =>
      Boolean(target.closest('[data-day-cell="true"]')) ||
      Boolean(dayPreviewRef.current?.contains(target)),
  };
}

export function useCalendarSurfaceUiEffects({
  plannerWarningSeverity,
  dayPreview,
  hoverPreviewTimerRef,
  hoverPreviewCloseTimerRef,
  longPressTimerRef,
  pointerPressActiveRef,
  pointerInsideDayPreviewRef,
  setWarningsDismissed,
}: {
  plannerWarningSeverity: string;
  dayPreview: DayPreviewState | null;
  hoverPreviewTimerRef: React.RefObject<number | null>;
  hoverPreviewCloseTimerRef: React.RefObject<number | null>;
  longPressTimerRef: React.RefObject<number | null>;
  pointerPressActiveRef: React.MutableRefObject<boolean>;
  pointerInsideDayPreviewRef: React.MutableRefObject<boolean>;
  setWarningsDismissed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const previousWarningSeverityRef = useRef(plannerWarningSeverity);

  useEffect(() => {
    if (
      plannerWarningSeverity === "actionable" &&
      previousWarningSeverityRef.current !== "actionable"
    ) {
      setWarningsDismissed(false);
    }
    previousWarningSeverityRef.current = plannerWarningSeverity;
  }, [plannerWarningSeverity, setWarningsDismissed]);

  useEffect(
    () => () => {
      if (hoverPreviewTimerRef.current) {
        window.clearTimeout(hoverPreviewTimerRef.current);
      }
      if (hoverPreviewCloseTimerRef.current) {
        window.clearTimeout(hoverPreviewCloseTimerRef.current);
      }
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    },
    [hoverPreviewCloseTimerRef, hoverPreviewTimerRef, longPressTimerRef]
  );

  useEffect(() => {
    const clearPointerPress = () => {
      pointerPressActiveRef.current = false;
    };
    window.addEventListener("pointerup", clearPointerPress);
    window.addEventListener("pointercancel", clearPointerPress);
    window.addEventListener("blur", clearPointerPress);
    return () => {
      window.removeEventListener("pointerup", clearPointerPress);
      window.removeEventListener("pointercancel", clearPointerPress);
      window.removeEventListener("blur", clearPointerPress);
    };
  }, [pointerPressActiveRef]);

  useEffect(() => {
    if (!dayPreview) {
      pointerInsideDayPreviewRef.current = false;
    }
  }, [dayPreview, pointerInsideDayPreviewRef]);
}
