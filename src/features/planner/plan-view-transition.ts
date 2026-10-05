export const PLAN_MORPH_CLASS = "plan-morph";
export const PLAN_VIEW_SWAP_CLASS = "plan-view-swap";

/** Zero velocity *and* zero acceleration at both ends, so nothing snaps into motion. */
export const smootherstep = (t: number) => t * t * t * (t * (6 * t - 15) + 10);

let morphEasing: string | null = null;
/**
 * Smootherstep as a CSS easing, for WAAPI morphs that should feel like the
 * rAF-driven plan view morph. Browsers without `linear()` get the closest cubic.
 */
export function planMorphEasing() {
  if (morphEasing) return morphEasing;
  const supported =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("transition-timing-function", "linear(0, 1)");
  morphEasing = supported
    ? `linear(${Array.from({ length: 33 }, (_, index) => +smootherstep(index / 32).toFixed(4)).join(", ")})`
    : "cubic-bezier(0.65, 0, 0.35, 1)";
  return morphEasing;
}

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
