export const PLANNER_CHECKLIST_PANE_TEST_ID = "plan-day-pane";

export function scrollPlannerChecklistIntoView() {
  if (typeof document === "undefined") {
    return false;
  }
  const pane = document.querySelector(
    `[data-testid="${PLANNER_CHECKLIST_PANE_TEST_ID}"]`
  );
  if (!(pane instanceof HTMLElement)) {
    return false;
  }
  pane.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}
