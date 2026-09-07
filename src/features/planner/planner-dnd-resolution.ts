import type { PlannerDragTarget } from "@/features/planner/planner-drag-target";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";

export type PlannerDndResolution =
  | { kind: "clear" }
  | {
      kind: "reorder_preview";
      day: string;
      activeEntryKey: string;
      overEntryKey: string;
    }
  | {
      kind: "move_entry";
      entry: PlannerDayDetailEntry;
      nextDate: string;
    };

export function resolvePlannerDndResolution({
  entryKey,
  target,
  entryByKey,
  entryDayByKey,
}: {
  entryKey: string;
  target: PlannerDragTarget;
  entryByKey: Map<string, PlannerDayDetailEntry>;
  entryDayByKey: Map<string, string>;
}): PlannerDndResolution {
  if (!target) {
    return { kind: "clear" };
  }
  const entry = entryByKey.get(entryKey);
  if (!entry) {
    return { kind: "clear" };
  }
  const sourceDay = entryDayByKey.get(entryKey) ?? null;
  if (target.type === "preview_entry") {
    if (sourceDay === target.day) {
      if (target.entryKey === entryKey) {
        return { kind: "clear" };
      }
      return {
        kind: "reorder_preview",
        day: target.day,
        activeEntryKey: entryKey,
        overEntryKey: target.entryKey,
      };
    }
    return {
      kind: "move_entry",
      entry,
      nextDate: target.day,
    };
  }
  if (sourceDay === target.day) {
    return { kind: "clear" };
  }
  return {
    kind: "move_entry",
    entry,
    nextDate: target.day,
  };
}
