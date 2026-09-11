import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CONCEPT_TODAY } from "@/features/ux-concepts/seed";

export const PLAN_ZOOM_DURATION_MS = 720;
export const PLAN_ZOOM_EASE_CSS = "cubic-bezier(0.2, 0.8, 0.2, 1)";
export const PLAN_ZOOM_STAGE_HEIGHT = 490;
export const PLAN_ZOOM_CELL_COUNT = 42;
export const PLAN_ZOOM_ROW_COUNT = 6;
export const PLAN_ZOOM_GAP = 6;
export const PLAN_ZOOM_ITEM_SLOTS = 2;
export const PLAN_ZOOM_MONTH_START = "2026-09-01";
export const PLAN_ZOOM_MONTH_END = "2026-09-30";

export type PlanZoomStudy = "calendar" | "goals";
export type CalendarMotion = "anchor" | "ribbon";
export type GoalExperience = "folio" | "constellation";
export type PlanZoomLevel = 0 | 1 | 2;

export type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LayerSlot = number | null;

const GRID_START = startOfWeek(startOfMonth(parseISO(PLAN_ZOOM_MONTH_START)), {
  weekStartsOn: 0,
});

export function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function easeSmooth(t: number) {
  return t * t * (3 - 2 * t);
}

export function mixBox(a: Box, b: Box, t: number): Box {
  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    w: mix(a.w, b.w, t),
    h: mix(a.h, b.h, t),
  };
}

export function planZoomCellDate(index: number) {
  return addDays(GRID_START, index);
}

export function planZoomIsoForIndex(index: number) {
  return format(planZoomCellDate(index), "yyyy-MM-dd");
}

export function planZoomIndexForIso(iso: string) {
  return differenceInCalendarDays(parseISO(iso), GRID_START);
}

export function clampSeptemberIso(iso: string) {
  if (iso < PLAN_ZOOM_MONTH_START) {
    return PLAN_ZOOM_MONTH_START;
  }
  if (iso > PLAN_ZOOM_MONTH_END) {
    return PLAN_ZOOM_MONTH_END;
  }
  return iso;
}

export function isSeptemberIso(iso: string) {
  return iso >= PLAN_ZOOM_MONTH_START && iso <= PLAN_ZOOM_MONTH_END;
}

export function levelFromDepth(depth: number): PlanZoomLevel {
  if (depth < 0.5) {
    return 0;
  }
  if (depth < 1.5) {
    return 1;
  }
  return 2;
}

export function layoutLayerBox({
  index,
  slot,
  depth,
  selected,
  stageWidth,
  stageHeight,
  mode,
}: {
  index: number;
  slot: LayerSlot;
  depth: number;
  selected: number;
  stageWidth: number;
  stageHeight: number;
  mode: CalendarMotion;
}): Box {
  const gap = PLAN_ZOOM_GAP;
  const column = index % 7;
  const row = Math.floor(index / 7);
  const selectedRow = Math.floor(selected / 7);
  const weekIndex = index - selectedRow * 7;
  const monthWidth = (stageWidth - 6 * gap) / 7;
  const monthHeight =
    (stageHeight - (PLAN_ZOOM_ROW_COUNT - 1) * gap) / PLAN_ZOOM_ROW_COUNT;
  const weekHeight = (stageHeight - 6 * gap) / 7;
  let month: Box = {
    x: column * (monthWidth + gap),
    y: row * (monthHeight + gap),
    w: monthWidth,
    h: monthHeight,
  };
  let week: Box = {
    x: 0,
    y: weekIndex * (weekHeight + gap),
    w: stageWidth,
    h: weekHeight,
  };
  let day: Box = {
    x: 0,
    y: (index - selected) * (stageHeight + gap),
    w: stageWidth,
    h: stageHeight,
  };

  if (slot !== null) {
    month = {
      x: month.x + 3,
      y: month.y + 32 + slot * 25,
      w: Math.max(8, month.w - 6),
      h: 21,
    };
    week = {
      x: 70,
      y: week.y + 7 + slot * 27,
      w: Math.max(8, week.w - 80),
      h: 23,
    };
    day = {
      x: 14,
      y: day.y + 95 + slot * 90,
      w: Math.max(8, day.w - 28),
      h: 76,
    };
  }

  if (depth >= 1) {
    return mixBox(week, day, depth - 1);
  }

  if (mode === "anchor") {
    const box = mixBox(month, week, depth);
    box.x +=
      Math.sin(depth * Math.PI) *
      (column - (selected % 7)) *
      Math.min(5, stageWidth / 80);
    return box;
  }

  const spine: Box =
    slot === null
      ? { x: 0, y: week.y, w: 62, h: week.h }
      : {
          x: 70,
          y: week.y + 7 + slot * 27,
          w: Math.max(month.w, Math.min(172, week.w)),
          h: 23,
        };
  const from = depth < 0.48 ? month : spine;
  const to = depth < 0.48 ? spine : week;
  const local = depth < 0.48 ? depth / 0.48 : (depth - 0.48) / 0.52;
  return mixBox(from, to, easeSmooth(local));
}

export function calendarHeading(depth: number, selectedIso: string) {
  const selected = parseISO(selectedIso);
  if (depth < 0.5) {
    return "September 2026";
  }
  if (depth < 1.5) {
    const weekStart = startOfWeek(selected, { weekStartsOn: 0 });
    return `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d")}`;
  }
  return format(selected, "EEEE");
}

export function calendarCaption(depth: number) {
  if (depth < 0.5) {
    return "Tap a named pill or a date";
  }
  if (depth < 1.5) {
    return "The same pills · tap to open the day";
  }
  return "The same items · checkbox completes";
}

export function calendarStatus(depth: number, selectedIso: string) {
  const label = format(parseISO(selectedIso), "MMMM d");
  const view = ["Month", "Vertical week", "Day checklist"][levelFromDepth(depth)];
  return `${label} · ${view}`;
}

export const PLAN_ZOOM_TODAY_INDEX = planZoomIndexForIso(CONCEPT_TODAY);
