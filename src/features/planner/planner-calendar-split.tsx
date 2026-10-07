"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { panelClass } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import {
  clampPlanCalendarSplit,
  PLAN_CALENDAR_SPLIT_DEFAULT,
  PLAN_CALENDAR_SPLIT_MAX,
  PLAN_CALENDAR_SPLIT_MIN,
  PLAN_CALENDAR_SPLIT_STEP,
  planCalendarSplitFromPointer,
} from "@/features/planner/planner-calendar-split-model";

export function PlannerCalendarSplit({
  calendar,
  pane,
}: {
  calendar: ReactNode;
  /** Null renders the calendar alone at full width. */
  pane: ReactNode;
}) {
  const splitterId = useId();
  const splitRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startFraction: number;
    totalWidth: number;
  } | null>(null);
  const [fraction, setFraction] = useState(PLAN_CALENDAR_SPLIT_DEFAULT);

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const split = splitRef.current;
    if (!split) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startFraction: fraction,
      totalWidth: split.getBoundingClientRect().width,
    };
  }, [fraction]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    setFraction(
      planCalendarSplitFromPointer({
        clientX: event.clientX,
        startX: drag.startX,
        startFraction: drag.startFraction,
        totalWidth: drag.totalWidth,
      })
    );
  }, []);

  const onPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      setFraction((current) =>
        clampPlanCalendarSplit(current + direction * PLAN_CALENDAR_SPLIT_STEP)
      );
    }
    if (event.key === "Home") {
      event.preventDefault();
      setFraction(PLAN_CALENDAR_SPLIT_MIN);
    }
    if (event.key === "End") {
      event.preventDefault();
      setFraction(PLAN_CALENDAR_SPLIT_MAX);
    }
  }, []);

  if (!pane) {
    return <div className="@container min-w-0">{calendar}</div>;
  }

  return (
    <div
      ref={splitRef}
      data-testid="plan-calendar-split"
      className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,var(--plan-split-calendar))_minmax(0,var(--plan-split-pane))] md:items-start md:gap-x-2 md:gap-y-0"
      style={
        {
          "--plan-split-calendar": `${fraction}fr`,
          "--plan-split-pane": `${1 - fraction}fr`,
        } as CSSProperties
      }
    >
      <div
        className="flex min-w-0 items-stretch"
        data-testid="plan-calendar-split-calendar"
      >
        <div className="@container min-w-0 flex-1 overflow-hidden">{calendar}</div>
        <div
          role="separator"
          tabIndex={0}
          id={splitterId}
          className={cn(
            "hidden md:flex w-2 shrink-0 cursor-col-resize touch-none items-center justify-center self-stretch rounded-full",
            "bg-transparent hover:bg-border/80",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          )}
          aria-label="Resize calendar and checklist"
          aria-orientation="vertical"
          aria-valuemin={Math.round(PLAN_CALENDAR_SPLIT_MIN * 100)}
          aria-valuemax={Math.round(PLAN_CALENDAR_SPLIT_MAX * 100)}
          aria-valuenow={Math.round(fraction * 100)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
        >
          <span className="h-10 w-1 rounded-full bg-border" aria-hidden />
        </div>
      </div>
      <aside className={cn("min-w-0 self-start p-4 md:mt-0 md:p-5", panelClass)} data-testid="plan-desktop-day-pane">
        {pane}
      </aside>
    </div>
  );
}
