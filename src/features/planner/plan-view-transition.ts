export const PLAN_MORPH_CLASS = "plan-morph";
export const PLAN_VIEW_SWAP_CLASS = "plan-view-swap";

/** jsdom and older browsers omit `matchMedia`, so treat its absence as "motion allowed". */
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function planDayViewTransitionName(day: string) {
  return `plan-day-${day}`;
}

export function planEntryViewTransitionName(entryKey: string) {
  return `plan-entry-${entryKey.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
}
