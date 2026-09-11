import { flushSync } from "react-dom";
import type { PlannerCalendarViewMode } from "@/features/planner/calendar-surface.types";

export const PLAN_MORPH_CLASS = "plan-morph";
export const PLAN_MORPH_PILL_CLASS = "plan-morph-pill";
export const PLAN_ENTRY_MORPH_CLASS = `${PLAN_MORPH_CLASS} ${PLAN_MORPH_PILL_CLASS}`;
export const PLAN_VIEW_SWAP_CLASS = "plan-view-swap";
export const PLAN_VIEW_ROOT_TRANSITION_NAME = "plan-view-root";
export const PLAN_VIEW_CHROME_TRANSITION_NAME = "plan-view-chrome";
export const PLAN_VIEW_TOOLBAR_TRANSITION_NAME = "plan-view-toolbar";
export const PLAN_VIEW_TRANSITION_CLASS = "plan-zoom-vt";
export const PLAN_VIEW_WEEK_TO_MONTH_CLASS = "plan-zoom-week-to-month";

export type PlanViewTransitionKind =
  | "default"
  | "week-to-month"
  | "month-to-week";

type PlanViewTransition = {
  finished: Promise<unknown>;
  skipTransition: () => void;
};

let activePlanViewTransition: PlanViewTransition | null = null;
let planViewTransitionGeneration = 0;

export function planDayViewTransitionName(day: string) {
  return `plan-day-${day}`;
}

export function planEntryViewTransitionName(entryKey: string) {
  return `plan-entry-${entryKey.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
}

function normalizePlanPairView(
  viewMode: PlannerCalendarViewMode
): "day" | "week" | "month" {
  if (viewMode === "month") {
    return "month";
  }
  if (viewMode === "day") {
    return "day";
  }
  return "week";
}

export function planViewTransitionKind(
  fromViewMode: PlannerCalendarViewMode,
  toViewMode: PlannerCalendarViewMode
): PlanViewTransitionKind {
  const from = normalizePlanPairView(fromViewMode);
  const to = normalizePlanPairView(toViewMode);
  if (from === "week" && to === "month") {
    return "week-to-month";
  }
  if (from === "month" && to === "week") {
    return "month-to-week";
  }
  return "default";
}

export function prefersPlanViewMotion(): boolean {
  return (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function" ||
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function canStartPlanViewTransition(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof document.startViewTransition === "function" &&
    prefersPlanViewMotion()
  );
}

function skipActivePlanViewTransition() {
  const current = activePlanViewTransition;
  if (!current) {
    return;
  }
  try {
    current.skipTransition();
  } catch {
    // The previous transition already finished.
  }
  activePlanViewTransition = null;
}

function applyPlanViewTransitionChrome(kind: PlanViewTransitionKind) {
  document.documentElement.classList.add(PLAN_VIEW_TRANSITION_CLASS);
  document.documentElement.classList.toggle(
    PLAN_VIEW_WEEK_TO_MONTH_CLASS,
    kind === "week-to-month"
  );
  document.documentElement.dataset.planPair =
    kind === "week-to-month" || kind === "month-to-week"
      ? "week-month"
      : "day";
}

function clearPlanViewTransitionChrome() {
  document.documentElement.classList.remove(
    PLAN_VIEW_TRANSITION_CLASS,
    PLAN_VIEW_WEEK_TO_MONTH_CLASS
  );
  delete document.documentElement.dataset.planPair;
}

export function runPlanViewTransition(
  update: () => void,
  kind: PlanViewTransitionKind = "default"
) {
  if (!canStartPlanViewTransition()) {
    update();
    return;
  }

  skipActivePlanViewTransition();
  const token = ++planViewTransitionGeneration;
  applyPlanViewTransitionChrome(kind);

  let transition: PlanViewTransition;
  try {
    transition = document.startViewTransition(() => {
      flushSync(update);
    });
  } catch {
    clearPlanViewTransitionChrome();
    update();
    return;
  }

  activePlanViewTransition = transition;
  void transition.finished.finally(() => {
    if (planViewTransitionGeneration !== token) {
      return;
    }
    activePlanViewTransition = null;
    clearPlanViewTransitionChrome();
  });
}
