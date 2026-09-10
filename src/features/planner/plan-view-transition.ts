import { flushSync } from "react-dom";

export const PLAN_MORPH_CLASS = "plan-morph";
export const PLAN_VIEW_SWAP_CLASS = "plan-view-swap";

export function planDayViewTransitionName(day: string) {
  return `plan-day-${day}`;
}

export function planEntryViewTransitionName(entryKey: string) {
  return `plan-entry-${entryKey.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
}

export function canRunPlanViewTransition() {
  return (
    typeof document !== "undefined" &&
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function runPlanViewTransition(update: () => void) {
  if (!canRunPlanViewTransition()) {
    update();
    return;
  }
  document.startViewTransition(() => {
    flushSync(update);
  });
}
