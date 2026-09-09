import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollPlannerChecklistIntoView } from "@/features/planner/planner-checklist-scroll";

describe("scrollPlannerChecklistIntoView", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("scrolls the focused day checklist below the sticky header", () => {
    const header = document.createElement("header");
    header.dataset.testid = "app-shell-header";
    Object.defineProperty(header, "getBoundingClientRect", {
      value: () => ({ height: 64, top: 0, bottom: 64, left: 0, right: 0, width: 320, x: 0, y: 0, toJSON: () => ({}) }),
    });
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element) =>
        ({
          position: element === header ? "sticky" : "static",
        }) as CSSStyleDeclaration
    );
    const pane = document.createElement("div");
    pane.dataset.testid = "plan-day-pane";
    Object.defineProperty(pane, "getBoundingClientRect", {
      value: () => ({
        height: 400,
        top: 240,
        bottom: 640,
        left: 0,
        right: 0,
        width: 320,
        x: 0,
        y: 240,
        toJSON: () => ({}),
      }),
    });
    document.body.append(header, pane);
    const scrollTo = vi.fn();
    vi.spyOn(window, "scrollTo").mockImplementation(scrollTo);

    expect(scrollPlannerChecklistIntoView()).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({
      top: 240 - 72,
      behavior: "smooth",
    });
  });

  it("returns false when the checklist pane is missing", () => {
    expect(scrollPlannerChecklistIntoView()).toBe(false);
  });
});
