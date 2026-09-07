import { isPlannerTaskCalendarEntry } from "@/features/planner/calendar-task-entries";
import type {
  PlannerCompletionFactMarker,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";

export function filterPlannerDayEntries(
  entries: PlannerDayDetailEntry[],
  visibleGoalIds: ReadonlySet<string> | null
): PlannerDayDetailEntry[] {
  if (visibleGoalIds === null) {
    return entries;
  }
  return entries.filter(
    (entry) =>
      isPlannerTaskCalendarEntry(entry) || visibleGoalIds.has(entry.originalGoalId)
  );
}

export function filterPlannerDayMarkers(
  markers: PlannerCompletionFactMarker[],
  visibleGoalIds: ReadonlySet<string> | null
): PlannerCompletionFactMarker[] {
  if (visibleGoalIds === null) {
    return markers;
  }
  return markers.filter(
    (marker) =>
      marker.owner === "partner" || visibleGoalIds.has(marker.originalGoalId)
  );
}
