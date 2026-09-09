export const PLANNER_CHECKLIST_PANE_TEST_ID = "plan-day-pane";
export const APP_SHELL_HEADER_TEST_ID = "app-shell-header";

function stickyHeaderOffset() {
  const header = document.querySelector(
    `[data-testid="${APP_SHELL_HEADER_TEST_ID}"]`
  );
  if (!(header instanceof HTMLElement)) {
    return 8;
  }
  const styles = window.getComputedStyle(header);
  if (styles.position !== "sticky" && styles.position !== "fixed") {
    return 8;
  }
  return Math.ceil(header.getBoundingClientRect().height) + 8;
}

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
  const top = window.scrollY + pane.getBoundingClientRect().top - stickyHeaderOffset();
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  return true;
}
