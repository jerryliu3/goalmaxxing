export const PLAN_MORPH_CLASS = "plan-morph";
export const PLAN_VIEW_SWAP_CLASS = "plan-view-swap";

export function planDayViewTransitionName(day: string) {
  return `plan-day-${day}`;
}

export function planEntryViewTransitionName(entryKey: string) {
  return `plan-entry-${entryKey.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
}
