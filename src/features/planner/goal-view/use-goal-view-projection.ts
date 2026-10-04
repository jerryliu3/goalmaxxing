import { useMemo } from "react";
import { listWindowDays } from "./goal-view-model";

/**
 * The days Goal View reads while open, and the planner projection days widened
 * to cover them (the calendar model only materializes entries for projected days).
 */
export function useGoalViewProjection({
  open,
  window,
  baseProjectionDays,
}: {
  open: boolean;
  window: { start: string; end: string } | null;
  baseProjectionDays: string[];
}) {
  const goalViewDays = useMemo(
    () => (open && window ? listWindowDays(window) : []),
    [open, window]
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
