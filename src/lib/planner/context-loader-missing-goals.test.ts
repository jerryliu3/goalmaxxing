import { describe, expect, it } from "vitest";
import { partitionPlannerItemsByKnownGoals } from "@/lib/planner/context-loader";

describe("partitionPlannerItemsByKnownGoals", () => {
  it("keeps items whose goals are still loaded and reports the rest", () => {
    const result = partitionPlannerItemsByKnownGoals(
      [
        { id: "item-kept", goal_id: "goal-live" },
        { id: "item-orphan", goal_id: "goal-deleted" },
      ],
      [{ id: "goal-live" }]
    );

    expect(result.knownItems).toEqual([{ id: "item-kept", goal_id: "goal-live" }]);
    expect(result.skippedItems).toEqual([
      { itemId: "item-orphan", goalId: "goal-deleted" },
    ]);
  });
});
