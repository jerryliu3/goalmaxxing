import { describe, expect, it } from "vitest";
import { linkedGoalMarkLabel } from "@/features/planner/linked-goal-marks";

describe("linkedGoalMarkLabel", () => {
  it("names the source, the target, and a goal that is both", () => {
    expect(linkedGoalMarkLabel(true, false)).toBe("Counts toward another goal");
    expect(linkedGoalMarkLabel(false, true)).toBe("Another goal counts toward this");
    expect(linkedGoalMarkLabel(true, true)).toBe(
      "Counts toward another goal, and another goal counts toward this",
    );
  });
});
