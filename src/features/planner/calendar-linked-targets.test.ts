import { describe, expect, it } from "vitest";
import {
  buildPlannerLinkedTargetIndexes,
} from "@/features/planner/calendar-linked-targets";
import type { PlannerGoalLinkSummary } from "@cadence/shared/planner/context";

describe("buildPlannerLinkedTargetIndexes", () => {
  it("builds deterministic source/target link indexes", () => {
    const links: PlannerGoalLinkSummary[] = [
      {
        sourceGoalId: "goal-b",
        targetGoalId: "goal-c",
      },
      {
        sourceGoalId: "goal-a",
        targetGoalId: "goal-c",
      },
      {
        sourceGoalId: "goal-a",
        targetGoalId: "goal-b",
      },
    ];
    const indexes = buildPlannerLinkedTargetIndexes(links);

    expect(indexes.linksBySourceGoalId.get("goal-a")?.map((link) => link.targetGoalId)).toEqual([
      "goal-b",
      "goal-c",
    ]);
    expect(indexes.linksBySourceGoalId.get("goal-b")?.map((link) => link.targetGoalId)).toEqual([
      "goal-c",
    ]);
    expect(indexes.linksByTargetGoalId.get("goal-c")?.map((link) => link.sourceGoalId)).toEqual([
      "goal-a",
      "goal-b",
    ]);
    expect(indexes.linksBySourceGoalId.get("goal-a")).toHaveLength(2);
    expect(indexes.linksByTargetGoalId.get("goal-c")).toHaveLength(2);
  });
});

