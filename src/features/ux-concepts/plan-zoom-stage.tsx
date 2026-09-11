"use client";

import { format, isSameMonth } from "date-fns";
import { useReducedMotion } from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  planMonthDayNumberClass,
  planMonthDaySurfaceClass,
} from "@/features/planner/calendar-day-chrome";
import {
  calendarCaption,
  calendarHeading,
  calendarStatus,
  clamp01,
  clampSeptemberIso,
  easeSmooth,
  isSeptemberIso,
  layoutLayerBox,
  levelFromDepth,
  mix,
  PLAN_ZOOM_CELL_COUNT,
  PLAN_ZOOM_DURATION_MS,
  PLAN_ZOOM_ITEM_SLOTS,
  PLAN_ZOOM_STAGE_HEIGHT,
  planZoomCellDate,
  planZoomIndexForIso,
  planZoomIsoForIndex,
  type Box,
  type CalendarMotion,
  type PlanZoomLevel,
} from "@/features/ux-concepts/plan-zoom-motion";
import { zoomItemsOnDate } from "@/features/ux-concepts/plan-zoom-seed";
import {
  CONCEPT_TODAY,
  STRENGTH_MISSED_DATE,
  type ConceptItem,
} from "@/features/ux-concepts/seed";
import type { ConceptSession } from "@/features/ux-concepts/use-concept-session";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export type CalendarStageHandle = {
  go: (to: PlanZoomLevel) => void;
  selectIso: (iso: string, to?: PlanZoomLevel) => void;
  depth: () => number;
};

export type CalendarMeta = {
  depth: number;
  level: PlanZoomLevel;
  heading: string;
  caption: string;
  status: string;
};

function place(node: HTMLElement, box: Box, width: number, height: number) {
  node.style.transform = `translate(${box.x}px, ${box.y}px)`;
  node.style.width = `${Math.max(1, box.w)}px`;
  node.style.height = `${Math.max(1, box.h)}px`;
  const visible =
    box.x + box.w > 0 && box.x < width && box.y + box.h > 0 && box.y < height;
  node.style.visibility = visible ? "visible" : "hidden";
  node.toggleAttribute("inert", !visible);
  node.setAttribute("aria-hidden", String(!visible));
  return visible;
}

export const PlanZoomStage = forwardRef<
  CalendarStageHandle,
  {
    session: ConceptSession;
    mode: CalendarMotion;
    intent: { level: PlanZoomLevel; id: number };
    onMeta: (meta: CalendarMeta) => void;
  }
>(function PlanZoomStage({ session, mode, intent, onMeta }, ref) {
  const reduceMotion = useReducedMotion() === true;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rangeRef = useRef<HTMLInputElement | null>(null);
  const weekdayRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLSpanElement | null>(null);
  const depthRef = useRef(0);
  const selectedRef = useRef(planZoomIndexForIso(session.selectedDate));
  const modeRef = useRef(mode);
  const reduceRef = useRef(reduceMotion);
  const rafRef = useRef(0);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const lastMetaRef = useRef("");
  const [liveStatus, setLiveStatus] = useState(
    calendarStatus(0, session.selectedDate)
  );

  const cells = useMemo(
    () =>
      Array.from({ length: PLAN_ZOOM_CELL_COUNT }, (_, index) => {
        const date = planZoomCellDate(index);
        const iso = format(date, "yyyy-MM-dd");
        const inMonth = isSeptemberIso(iso) && isSameMonth(date, parseMonth());
        return {
          index,
          date,
          iso,
          inMonth,
          items: inMonth
            ? zoomItemsOnDate(iso, session.recoveredTo).slice(
                0,
                PLAN_ZOOM_ITEM_SLOTS
              )
            : [],
        };
      }),
    [session.recoveredTo]
  );

  const flyingItems = useMemo(
    () =>
      cells.flatMap((cell) =>
        cell.items.map((item, slot) => ({
          key: `${cell.iso}:${item.id}`,
          index: cell.index,
          slot,
          iso: cell.iso,
          item,
        }))
      ),
    [cells]
  );

  const publishMeta = useCallback(
    (depth: number, iso: string) => {
      const heading = calendarHeading(depth, iso);
      const caption = calendarCaption(depth);
      const level = levelFromDepth(depth);
      const key = `${level}|${heading}|${caption}|${iso}`;
      if (lastMetaRef.current === key) {
        return;
      }
      lastMetaRef.current = key;
      onMeta({
        depth,
        level,
        heading,
        caption,
        status: calendarStatus(depth, iso),
      });
    },
    [onMeta]
  );

  const paint = useCallback(
    (depth: number) => {
      const stage = stageRef.current;
      if (!stage) {
        return;
      }
      const width = stage.clientWidth;
      const height = stage.clientHeight || PLAN_ZOOM_STAGE_HEIGHT;
      const selected = selectedRef.current;
      const dayMix = clamp01(depth - 1);
      depthRef.current = depth;
      if (rangeRef.current) {
        rangeRef.current.value = String(depth);
      }
      if (weekdayRef.current) {
        weekdayRef.current.style.opacity = depth < 0.45 ? "1" : "0";
      }
      if (captionRef.current) {
        captionRef.current.textContent = calendarCaption(depth);
      }
      cellRefs.current.forEach((node, index) => {
        if (!node) {
          return;
        }
        const box = layoutLayerBox({
          index,
          slot: null,
          depth,
          selected,
          stageWidth: width,
          stageHeight: height,
          mode: modeRef.current,
        });
        place(node, box, width, height);
        node.style.zIndex = index === selected ? "3" : "1";
        node.setAttribute("aria-pressed", String(index === selected));
        const weekday = node.querySelector<HTMLElement>("[data-layer=weekday]");
        if (weekday) {
          weekday.style.opacity = String(clamp01((box.w - 55) / 45));
        }
      });
      stage.querySelectorAll<HTMLDivElement>("[data-item-key]").forEach((root) => {
        const index = Number(root.dataset.itemIndex);
        const slot = Number(root.dataset.itemSlot);
        const box = layoutLayerBox({
          index,
          slot,
          depth,
          selected,
          stageWidth: width,
          stageHeight: height,
          mode: modeRef.current,
        });
        place(root, box, width, height);
        const title = root.querySelector<HTMLButtonElement>("[data-layer=title]");
        const check = root.querySelector<HTMLButtonElement>("[data-layer=check]");
        const meta = root.querySelector<HTMLElement>("[data-layer=meta]");
        root.style.zIndex = index === selected ? "10" : "5";
        root.style.borderRadius = `${mix(5, 0, dayMix)}px`;
        root.style.setProperty("--item-tint", `${100 * (1 - dayMix)}%`);
        root.style.borderBottomColor = `color-mix(in srgb, var(--border) ${dayMix * 100}%, transparent)`;
        if (title) {
          title.style.left = `${44 * dayMix}px`;
          title.style.paddingLeft = `${mix(5, 0, dayMix)}px`;
          title.style.fontSize = `${mix(12, 15, dayMix)}px`;
          title.style.paddingBottom = `${20 * dayMix}px`;
          title.disabled = dayMix > 0.99;
        }
        if (check) {
          check.style.clipPath = `inset(0 ${(1 - dayMix) * 100}% 0 0)`;
          check.toggleAttribute("inert", dayMix < 0.99);
          check.setAttribute("aria-hidden", String(dayMix < 0.99));
        }
        if (meta) {
          meta.style.opacity = String(clamp01((dayMix - 0.5) * 2));
        }
      });
      publishMeta(depth, planZoomIsoForIndex(selected));
    },
    [publishMeta]
  );

  const go = useCallback(
    (to: number) => {
      cancelAnimationFrame(rafRef.current);
      const from = depthRef.current;
      if (reduceRef.current || Math.abs(to - from) < 0.001) {
        paint(to);
        setLiveStatus(
          calendarStatus(to, planZoomIsoForIndex(selectedRef.current))
        );
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / PLAN_ZOOM_DURATION_MS);
        paint(mix(from, to, easeSmooth(t)));
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setLiveStatus(
            calendarStatus(to, planZoomIsoForIndex(selectedRef.current))
          );
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [paint]
  );

  const selectIndex = useCallback(
    (index: number, to: number) => {
      if (!isSeptemberIso(planZoomIsoForIndex(index))) {
        return;
      }
      cancelAnimationFrame(rafRef.current);
      selectedRef.current = index;
      session.setSelectedDate(planZoomIsoForIndex(index));
      go(to);
    },
    [go, session.setSelectedDate]
  );

  useImperativeHandle(
    ref,
    () => ({
      go: (to) => go(to),
      selectIso: (iso, to) => {
        const clamped = clampSeptemberIso(iso);
        selectIndex(
          planZoomIndexForIso(clamped),
          to ?? levelFromDepth(depthRef.current)
        );
      },
      depth: () => depthRef.current,
    }),
    [go, selectIndex]
  );

  useEffect(() => {
    modeRef.current = mode;
    reduceRef.current = reduceMotion;
  }, [mode, reduceMotion]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    paint(0);
    setLiveStatus(calendarStatus(0, planZoomIsoForIndex(selectedRef.current)));
  }, [mode, paint]);

  useEffect(() => {
    if (intent.id === 0) {
      return;
    }
    go(intent.level);
  }, [go, intent.id, intent.level]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    const observer = new ResizeObserver(() => paint(depthRef.current));
    observer.observe(stage);
    paint(depthRef.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [paint]);

  const onActivate = (index: number) => {
    if (movedRef.current || !cells[index]?.inMonth) {
      return;
    }
    selectIndex(index, depthRef.current < 0.5 ? 1 : 2);
  };

  return (
    <div data-plan-zoom="" className="flex h-full min-h-0 flex-col">
      <div
        ref={weekdayRef}
        className="grid w-full grid-cols-7 px-0.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
      >
        {WEEKDAYS.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
      <div
        ref={stageRef}
        className="relative mt-1 min-h-0 flex-1 overflow-hidden"
        style={{ touchAction: "pan-y" }}
        aria-label="Calendar. Tap a date to focus its week; tap a week row to open the day."
        onPointerDown={(event) => {
          pointerRef.current = { x: event.clientX, y: event.clientY };
          movedRef.current = false;
        }}
        onPointerMove={(event) => {
          const start = pointerRef.current;
          if (start && Math.abs(event.clientY - start.y) > 12) {
            movedRef.current = true;
          }
        }}
        onPointerUp={(event) => {
          const start = pointerRef.current;
          pointerRef.current = null;
          if (
            start &&
            depthRef.current > 1.8 &&
            Math.abs(event.clientY - start.y) > 45
          ) {
            const delta = event.clientY < start.y ? 1 : -1;
            const next = selectedRef.current + delta;
            if (next >= 0 && next < PLAN_ZOOM_CELL_COUNT) {
              selectIndex(next, 2);
            }
          }
        }}
        onPointerCancel={() => {
          pointerRef.current = null;
          movedRef.current = false;
        }}
      >
        {cells.map((cell) => {
          const selected = cell.iso === session.selectedDate;
          const isToday = cell.iso === CONCEPT_TODAY;
          const inMonth = cell.inMonth;
          const isPast = cell.iso < CONCEPT_TODAY && inMonth;
          const missed =
            cell.iso === STRENGTH_MISSED_DATE && !session.recovered;
          return (
            <div
              key={cell.iso}
              ref={(node) => {
                cellRefs.current[cell.index] = node;
              }}
              role="group"
              tabIndex={inMonth ? 0 : -1}
              aria-label={format(cell.date, "EEEE, MMMM d")}
              aria-current={isToday ? "date" : undefined}
              aria-disabled={!inMonth}
              className={cn(
                "absolute left-0 top-0 overflow-hidden rounded-lg border text-left",
                planMonthDaySurfaceClass({
                  inMonth,
                  isToday,
                  isSelected: selected,
                  isPastInMonth: isPast,
                }),
                missed && "border-amber-400/80"
              )}
              onClick={() => onActivate(cell.index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onActivate(cell.index);
                }
              }}
            >
              <span
                className={cn(
                  "absolute left-2 top-2 font-display text-lg font-semibold leading-none",
                  planMonthDayNumberClass({
                    inMonth,
                    isToday,
                    isSelected: selected,
                  })
                )}
              >
                {format(cell.date, "d")}
              </span>
              <span
                data-layer="weekday"
                className="absolute left-9 top-2.5 text-xs text-muted-foreground"
              >
                {format(cell.date, "EEE")}
              </span>
            </div>
          );
        })}
        {flyingItems.map((entry) => (
          <CarriedItem
            key={entry.key}
            entry={entry}
            completed={session.isComplete(entry.item.id)}
            onOpen={() => onActivate(entry.index)}
            onToggle={() => session.toggleComplete(entry.item.id)}
          />
        ))}
      </div>
      <label className="mt-3 grid gap-2 text-xs text-muted-foreground">
        <span>Scrub: month → vertical week → checklist</span>
        <input
          ref={rangeRef}
          type="range"
          min={0}
          max={2}
          step={0.01}
          defaultValue={0}
          className="w-full accent-primary"
          aria-label="Calendar depth"
          onInput={(event) => {
            cancelAnimationFrame(rafRef.current);
            paint(Number(event.currentTarget.value));
          }}
          onChange={(event) => {
            go(Math.round(Number(event.currentTarget.value)) as PlanZoomLevel);
          }}
        />
      </label>
      <div className="mt-2 flex items-start justify-between gap-3 text-[11px] text-muted-foreground">
        <span ref={captionRef}>{calendarCaption(0)}</span>
        <span className="sr-only" aria-live="polite">
          {liveStatus}
        </span>
      </div>
    </div>
  );
});

PlanZoomStage.displayName = "PlanZoomStage";

function parseMonth() {
  return planZoomCellDate(planZoomIndexForIso("2026-09-01"));
}

function CarriedItem({
  entry,
  completed,
  onOpen,
  onToggle,
}: {
  entry: {
    key: string;
    index: number;
    slot: number;
    iso: string;
    item: ConceptItem;
  };
  completed: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      role="group"
      data-item-key={entry.key}
      data-item-index={entry.index}
      data-item-slot={entry.slot}
      data-item-tone={entry.item.tone}
      aria-label={`${entry.item.title}, ${format(planZoomCellDate(entry.index), "MMMM d")}`}
      className="plan-zoom-item absolute left-0 top-0 overflow-hidden"
    >
      <button
        type="button"
        data-layer="title"
        className="plan-zoom-item-title absolute inset-0 min-h-0 truncate text-left"
        aria-label={`Open ${entry.item.title} on ${format(planZoomCellDate(entry.index), "MMMM d")}`}
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
      >
        {entry.item.title}
      </button>
      <button
        type="button"
        data-layer="check"
        className="plan-zoom-item-check absolute bottom-0 left-0 top-0 z-[2] grid w-11 place-content-center border-0 bg-transparent p-0"
        aria-label={`${completed ? "Undo" : "Complete"} ${entry.item.title}`}
        aria-pressed={completed}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <span
          className={cn(
            "grid size-[21px] place-content-center rounded-full border border-primary text-[13px] leading-none",
            completed && "bg-primary/20"
          )}
        >
          {completed ? "✓" : ""}
        </span>
      </button>
      <span
        data-layer="meta"
        className="pointer-events-none absolute bottom-[13px] left-11 whitespace-nowrap text-xs text-muted-foreground"
      >
        {entry.item.cadence} · planned
      </span>
    </div>
  );
}
