import type { PlannerWorkUnit } from "@/lib/planner/work-units";

type PlannerOccupancyUnit = Pick<
  PlannerWorkUnit,
  "scheduledDate" | "creditState"
>;

/**
 * A completion recorded on another date satisfies the unit and releases its
 * former planner slot. The completion date remains reserved independently by
 * the canonical completion fact.
 */
export function plannerUnitOccupiesScheduledDate(
  unit: PlannerOccupancyUnit
): unit is PlannerOccupancyUnit & { scheduledDate: string } {
  return (
    unit.scheduledDate !== null && unit.creditState !== "completed_elsewhere"
  );
}
