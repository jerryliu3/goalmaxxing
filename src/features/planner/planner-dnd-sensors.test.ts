import { describe, expect, it } from "vitest";
import { isPlannerCompletionPointerEvent } from "@/features/planner/planner-dnd-sensors";

describe("isPlannerCompletionPointerEvent", () => {
  it("ignores pointer events that start on the completion mark", () => {
    const mark = document.createElement("button");
    mark.setAttribute("data-motion", "completion-toggle");
    const event = new Event("pointerdown");
    Object.defineProperty(event, "target", { value: mark });
    expect(isPlannerCompletionPointerEvent(event)).toBe(true);
  });

  it("allows pointer events on the rest of a work row", () => {
    const handle = document.createElement("div");
    handle.setAttribute("data-plan-drag-handle", "true");
    const event = new Event("pointerdown");
    Object.defineProperty(event, "target", { value: handle });
    expect(isPlannerCompletionPointerEvent(event)).toBe(false);
  });
});
