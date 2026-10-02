import { useMemo } from "react";
import { buildGoalViewWindow, listWindowDays } from "./goal-view-model";

/**
 * The days Goal View reads while open, and the planner projection days widened
 * to cover them (the calendar model only materializes entries for projected days).
 */
export function useGoalViewProjection({
  open,
  today,
  baseProjectionDays,
}: {
  open: boolean;
  today: string;
  baseProjectionDays: string[];
}) {
  const goalViewDays = useMemo(
    () => (open ? listWindowDays(buildGoalViewWindow(today)) : []),
    [open, today]
  );
  const projectionDays = useMemo(
    () =>
      goalViewDays.length > 0
        ? [...baseProjectionDays, ...goalViewDays]
        : baseProjectionDays,
    [baseProjectionDays, goalViewDays]
  );
  return { goalViewDays, projectionDays };
}
