"use client";

import {
  useCallback,
  useEffect,
  type ReactNode,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type {
  DayPreviewState,
  PlannerCalendarViewMode,
} from "@/features/planner/calendar-surface.types";
import { computeDayPreviewPosition } from "@/features/planner/day-preview-popup";
import { useOutsidePointerDismiss } from "@/lib/ui/use-outside-pointer-dismiss";

const DAY_PREVIEW_HOVER_DELAY_MS = 1000;
export const DAY_PREVIEW_HOVER_GRACE_MS = 300;
const DAY_LONG_PRESS_DELAY_MS = 500;

interface UsePlannerDayPreviewInteractionsArgs {
  onLongPressDay?: (day: string) => void;
  renderTaskComposer?: (day: string) => ReactNode;
  dayPreview: DayPreviewState | null;
  setDayPreview: Dispatch<SetStateAction<DayPreviewState | null>>;
  setExpandedPreviewDay: (day: string | null) => void;
  setMoveDialogDay: (day: string | null) => void;
  setMoveDialogSourceEntryKey: (entryKey: string) => void;
  setSelectedEventEntryKey: (entryKey: string | null) => void;
  setLocalSelectedDay: (day: string | null) => void;
  onSelectedDayChange: (
    day: string | null,
    mode: "push" | "replace",
    nextViewMode?: PlannerCalendarViewMode
  ) => void;
  hoverPreviewTimerRef: MutableRefObject<number | null>;
  hoverPreviewCloseTimerRef: MutableRefObject<number | null>;
  longPressTimerRef: MutableRefObject<number | null>;
  longPressTriggeredRef: MutableRefObject<boolean>;
  pointerPressActiveRef: MutableRefObject<boolean>;
  pointerInsideDayPreviewRef: MutableRefObject<boolean>;
  lastTouchTapRef: MutableRefObject<{ day: string; at: number } | null>;
  suppressDayCellClickRef: MutableRefObject<{ day: string; active: boolean } | null>;
  dayPreviewRef: MutableRefObject<HTMLDivElement | null>;
  isDayPreviewSurfaceTarget: (target: Element) => boolean;
}

export interface PlannerDayPreviewInteractions {
  renderTaskComposer?: (day: string) => ReactNode;
  clearHoverPreviewTimer: () => void;
  clearHoverPreviewCloseTimer: () => void;
  clearLongPressTimer: () => void;
  openDayPreview: (args: {
    day: string;
    pinned: boolean;
    target: EventTarget & HTMLElement;
  }) => void;
  openMoveDialogForDay: (day: string) => void;
  openDayViewForDay: (day: string) => void;
  selectDayForView: (day: string, nextViewMode: PlannerCalendarViewMode) => void;
  scheduleHoverPreviewClose: (day: string) => void;
  scheduleHoverPreview: (day: string, target: EventTarget & HTMLElement) => void;
  handleDayCellClick: (day: string, target: EventTarget & HTMLElement) => void;
  startDayLongPress: (day: string) => void;
  pointerPressActiveRef: MutableRefObject<boolean>;
  longPressTriggeredRef: MutableRefObject<boolean>;
  lastTouchTapRef: MutableRefObject<{ day: string; at: number } | null>;
  suppressDayCellClickRef: MutableRefObject<{ day: string; active: boolean } | null>;
}

export function isHoverPreviewKeepAliveTarget(
  target: Element,
  day: string,
  popup: HTMLElement | null
) {
  if (popup?.contains(target)) {
    return true;
  }
  const origin = target.closest("[data-day]");
  return origin instanceof HTMLElement && origin.dataset.day === day;
}

export function usePlannerDayPreviewInteractions({
  onLongPressDay,
  renderTaskComposer,
  dayPreview,
  setDayPreview,
  setExpandedPreviewDay,
  setMoveDialogDay,
  setMoveDialogSourceEntryKey,
  setSelectedEventEntryKey,
  setLocalSelectedDay,
  onSelectedDayChange,
  hoverPreviewTimerRef,
  hoverPreviewCloseTimerRef,
  longPressTimerRef,
  longPressTriggeredRef,
  pointerPressActiveRef,
  pointerInsideDayPreviewRef,
  lastTouchTapRef,
  suppressDayCellClickRef,
  dayPreviewRef,
  isDayPreviewSurfaceTarget,
}: UsePlannerDayPreviewInteractionsArgs) {
  const clearHoverPreviewTimer = useCallback(() => {
    if (hoverPreviewTimerRef.current) {
      window.clearTimeout(hoverPreviewTimerRef.current);
      hoverPreviewTimerRef.current = null;
    }
  }, [hoverPreviewTimerRef]);

  const clearHoverPreviewCloseTimer = useCallback(() => {
    if (hoverPreviewCloseTimerRef.current) {
      window.clearTimeout(hoverPreviewCloseTimerRef.current);
      hoverPreviewCloseTimerRef.current = null;
    }
  }, [hoverPreviewCloseTimerRef]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, [longPressTimerRef]);

  const openDayPreview = useCallback(
    ({
      day,
      pinned,
      target,
    }: {
      day: string;
      pinned: boolean;
      target: EventTarget & HTMLElement;
    }) => {
      const rect = target.getBoundingClientRect();
      const position = computeDayPreviewPosition({
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
      setDayPreview({ day, position, pinned });
    },
    [setDayPreview]
  );

  const openMoveDialogForDay = useCallback(
    (day: string) => {
      setExpandedPreviewDay(null);
      setDayPreview(null);
      setMoveDialogDay(day);
      setMoveDialogSourceEntryKey("");
    },
    [setDayPreview, setExpandedPreviewDay, setMoveDialogDay, setMoveDialogSourceEntryKey]
  );

  const selectDayForView = useCallback(
    (day: string, nextViewMode: PlannerCalendarViewMode) => {
      setExpandedPreviewDay(null);
      setMoveDialogDay(null);
      setSelectedEventEntryKey(null);
      setLocalSelectedDay(day);
      onSelectedDayChange(day, "push", nextViewMode);
      setDayPreview(null);
    },
    [
      onSelectedDayChange,
      setDayPreview,
      setExpandedPreviewDay,
      setLocalSelectedDay,
      setMoveDialogDay,
      setSelectedEventEntryKey,
    ]
  );

  const openDayViewForDay = useCallback(
    (day: string) => {
      selectDayForView(day, "day");
    },
    [selectDayForView]
  );

  const shouldSuppressDayCellClick = useCallback(
    (day: string) => {
      const suppression = suppressDayCellClickRef.current;
      if (!suppression) {
        return false;
      }
      if (suppression.day !== day) {
        return false;
      }
      if (suppression.active) {
        suppressDayCellClickRef.current = null;
        return true;
      }
      return false;
    },
    [suppressDayCellClickRef]
  );

  const scheduleHoverPreviewClose = useCallback(
    (day: string) => {
      if (hoverPreviewCloseTimerRef.current) {
        return;
      }
      hoverPreviewCloseTimerRef.current = window.setTimeout(() => {
        hoverPreviewCloseTimerRef.current = null;
        setDayPreview((current) => {
          if (!current || current.pinned || current.day !== day) {
            return current;
          }
          if (pointerInsideDayPreviewRef.current) {
            return current;
          }
          return null;
        });
      }, DAY_PREVIEW_HOVER_GRACE_MS);
    },
    [hoverPreviewCloseTimerRef, pointerInsideDayPreviewRef, setDayPreview]
  );

  const scheduleHoverPreview = useCallback(
    (day: string, target: EventTarget & HTMLElement) => {
      if (dayPreview?.pinned || pointerPressActiveRef.current) {
        return;
      }
      if (dayPreview && dayPreview.day !== day) {
        return;
      }
      clearHoverPreviewCloseTimer();
      clearHoverPreviewTimer();
      hoverPreviewTimerRef.current = window.setTimeout(() => {
        if (pointerPressActiveRef.current) {
          return;
        }
        openDayPreview({ day, pinned: false, target });
      }, DAY_PREVIEW_HOVER_DELAY_MS);
    },
    [
      clearHoverPreviewCloseTimer,
      clearHoverPreviewTimer,
      dayPreview,
      hoverPreviewTimerRef,
      openDayPreview,
      pointerPressActiveRef,
    ]
  );

  const handleDayCellClick = useCallback(
    (day: string, target: EventTarget & HTMLElement) => {
      if (shouldSuppressDayCellClick(day)) {
        suppressDayCellClickRef.current = null;
        return;
      }
      if (longPressTriggeredRef.current) {
        longPressTriggeredRef.current = false;
        return;
      }
      if (dayPreview?.pinned && dayPreview.day === day) {
        setDayPreview(null);
        return;
      }
      clearHoverPreviewTimer();
      openDayPreview({ day, pinned: true, target });
    },
    [
      clearHoverPreviewTimer,
      dayPreview,
      longPressTriggeredRef,
      openDayPreview,
      setDayPreview,
      shouldSuppressDayCellClick,
      suppressDayCellClickRef,
    ]
  );

  const startDayLongPress = useCallback(
    (day: string) => {
      clearLongPressTimer();
      longPressTriggeredRef.current = false;
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        lastTouchTapRef.current = null;
        suppressDayCellClickRef.current = { day, active: true };
        setDayPreview(null);
        onLongPressDay?.(day);
      }, DAY_LONG_PRESS_DELAY_MS);
    },
    [clearLongPressTimer, longPressTimerRef, longPressTriggeredRef, lastTouchTapRef, suppressDayCellClickRef, setDayPreview, onLongPressDay]
  );

  useEffect(() => {
    const cancel = () => { pointerPressActiveRef.current = false; clearLongPressTimer(); };
    window.addEventListener("pointerup", cancel);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointerup", cancel);
      window.removeEventListener("pointercancel", cancel);
      clearLongPressTimer();
      clearHoverPreviewTimer();
    };
  }, [clearLongPressTimer, clearHoverPreviewTimer, pointerPressActiveRef]);

  useEffect(() => {
    if (!dayPreview || dayPreview.pinned) {
      return;
    }
    const handlePointerMove = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (
        isHoverPreviewKeepAliveTarget(
          target,
          dayPreview.day,
          dayPreviewRef.current
        )
      ) {
        pointerInsideDayPreviewRef.current = true;
        clearHoverPreviewCloseTimer();
        return;
      }
      pointerInsideDayPreviewRef.current = false;
      scheduleHoverPreviewClose(dayPreview.day);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [
    clearHoverPreviewCloseTimer,
    dayPreview,
    dayPreviewRef,
    pointerInsideDayPreviewRef,
    scheduleHoverPreviewClose,
  ]);

  useOutsidePointerDismiss({
    enabled: Boolean(dayPreview?.pinned),
    containerRef: dayPreviewRef,
    onDismiss: () => {
      setDayPreview(null);
    },
    shouldIgnoreTarget: isDayPreviewSurfaceTarget,
  });

  return {
    renderTaskComposer,
    clearHoverPreviewTimer,
    clearHoverPreviewCloseTimer,
    clearLongPressTimer,
    openDayPreview,
    openMoveDialogForDay,
    openDayViewForDay,
    selectDayForView,
    scheduleHoverPreviewClose,
    scheduleHoverPreview,
    handleDayCellClick,
    startDayLongPress,
    pointerPressActiveRef,
    longPressTriggeredRef,
    lastTouchTapRef,
    suppressDayCellClickRef,
  };
}
