export const PLAN_CALENDAR_SPLIT_DEFAULT = 0.72;
export const PLAN_CALENDAR_SPLIT_MIN = 0.38;
export const PLAN_CALENDAR_SPLIT_MAX = 0.82;
export const PLAN_CALENDAR_SPLIT_STEP = 0.02;

export function clampPlanCalendarSplit(value: number) {
  if (!Number.isFinite(value)) {
    return PLAN_CALENDAR_SPLIT_DEFAULT;
  }
  return Math.min(
    PLAN_CALENDAR_SPLIT_MAX,
    Math.max(PLAN_CALENDAR_SPLIT_MIN, value)
  );
}

export function planCalendarSplitFromPointer({
  clientX,
  startX,
  startFraction,
  totalWidth,
}: {
  clientX: number;
  startX: number;
  startFraction: number;
  totalWidth: number;
}) {
  if (totalWidth <= 0) {
    return clampPlanCalendarSplit(startFraction);
  }
  return clampPlanCalendarSplit(startFraction + (clientX - startX) / totalWidth);
}
