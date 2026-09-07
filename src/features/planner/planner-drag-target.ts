import { PLANNER_LIST_END_ENTRY_KEY } from "@cadence/shared/planner/reorder-preview-entries";

export const PLANNER_ENTRY_ID_PREFIX = "planner-entry:";
export const PLANNER_PREVIEW_ENTRY_DRAG_ID_PREFIX = "planner-entry-preview:";
export const PLANNER_DAY_ID_PREFIX = "planner-day:";
export const PLANNER_PREVIEW_ENTRY_DROP_ID_PREFIX = "planner-preview-entry:";
export { PLANNER_LIST_END_ENTRY_KEY };

export const PLANNER_SORTABLE_SURFACES = ["calendar", "checklist"] as const;
export type PlannerSortableSurface = (typeof PLANNER_SORTABLE_SURFACES)[number];

export function isPlannerSortableSurface(
  value: string
): value is PlannerSortableSurface {
  return (PLANNER_SORTABLE_SURFACES as readonly string[]).includes(value);
}

export function plannerEntryDragId(entryKey: string) {
  return `${PLANNER_ENTRY_ID_PREFIX}${entryKey}`;
}

export function plannerPreviewEntryDragId(day: string, entryKey: string) {
  return `${PLANNER_PREVIEW_ENTRY_DRAG_ID_PREFIX}${day}::${entryKey}`;
}

export function plannerDayDropId(day: string) {
  return `${PLANNER_DAY_ID_PREFIX}${day}`;
}

export function plannerPreviewEntryDropId(
  day: string,
  entryKey: string,
  surface: PlannerSortableSurface
) {
  return `${PLANNER_PREVIEW_ENTRY_DROP_ID_PREFIX}${surface}:${day}::${entryKey}`;
}

export function parsePlannerEntryDragId(id: string | number) {
  if (typeof id !== "string") {
    return null;
  }
  if (id.startsWith(PLANNER_ENTRY_ID_PREFIX)) {
    return id.slice(PLANNER_ENTRY_ID_PREFIX.length);
  }
  if (id.startsWith(PLANNER_PREVIEW_ENTRY_DRAG_ID_PREFIX)) {
    const parsed = id.slice(PLANNER_PREVIEW_ENTRY_DRAG_ID_PREFIX.length);
    const separatorIndex = parsed.indexOf("::");
    if (separatorIndex < 0) {
      return null;
    }
    return parsed.slice(separatorIndex + 2);
  }
  return parsePlannerPreviewEntryDropId(id)?.entryKey ?? null;
}

export function parsePlannerDayDropId(id: string | number) {
  if (typeof id !== "string" || !id.startsWith(PLANNER_DAY_ID_PREFIX)) {
    return null;
  }
  return id.slice(PLANNER_DAY_ID_PREFIX.length);
}

export function parsePlannerPreviewEntryDropId(id: string | number) {
  if (
    typeof id !== "string" ||
    !id.startsWith(PLANNER_PREVIEW_ENTRY_DROP_ID_PREFIX)
  ) {
    return null;
  }
  const parsed = id.slice(PLANNER_PREVIEW_ENTRY_DROP_ID_PREFIX.length);
  const surfaceSeparatorIndex = parsed.indexOf(":");
  if (surfaceSeparatorIndex < 0) {
    return null;
  }
  const surface = parsed.slice(0, surfaceSeparatorIndex);
  if (!isPlannerSortableSurface(surface)) {
    return null;
  }
  const remainder = parsed.slice(surfaceSeparatorIndex + 1);
  const separatorIndex = remainder.indexOf("::");
  if (separatorIndex < 0) {
    return null;
  }
  return {
    surface,
    day: remainder.slice(0, separatorIndex),
    entryKey: remainder.slice(separatorIndex + 2),
  };
}

export type PlannerDragTarget =
  | { type: "day"; day: string }
  | {
      type: "preview_entry";
      day: string;
      entryKey: string;
      surface?: PlannerSortableSurface;
    }
  | null;

export function parsePlannerDragTarget(id: string | number): PlannerDragTarget {
  const day = parsePlannerDayDropId(id);
  if (day) {
    return { type: "day", day };
  }
  const previewEntry = parsePlannerPreviewEntryDropId(id);
  if (previewEntry) {
    return {
      type: "preview_entry",
      day: previewEntry.day,
      entryKey: previewEntry.entryKey,
      surface: previewEntry.surface,
    };
  }
  return null;
}
