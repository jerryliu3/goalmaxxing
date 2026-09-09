import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollPlannerChecklistIntoView } from "@/features/planner/planner-checklist-scroll";

describe("scrollPlannerChecklistIntoView", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("scrolls the focused day checklist into view", () => {
    const pane = document.createElement("div");
    pane.dataset.testid = "plan-day-pane";
    const scrollIntoView = vi.fn();
    pane.scrollIntoView = scrollIntoView;
    document.body.append(pane);

    expect(scrollPlannerChecklistIntoView()).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("returns false when the checklist pane is missing", () => {
    expect(scrollPlannerChecklistIntoView()).toBe(false);
  });
});
