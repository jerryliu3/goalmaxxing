import { describe, expect, it } from "vitest";
import {
  selectChecklistHiddenLinkedTargetGoalIds,
  shouldHideLinkedTargetOnChecklistDate,
} from "@/lib/goals/checklist-link-suppression";
import type { Goal, GoalLink } from "@/lib/goals/types";

function goal(overrides: Partial<Goal> & Pick<Goal, "id" | "title">): Goal {
  return {
    owner_id: "owner-a",
    description: null,
    category: "health",
    color: null,
    frequency_type: "recurring",
    recurrence_interval: "daily",
    target_count: null,
    milestone_names: null,
    start_date: "2026-09-01",
    end_date: "2026-09-30",
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    target_basis: "period",
    ...overrides,
  };
}

function link(
  sourceGoalId: string,
  targetGoalId: string
): Pick<GoalLink, "source_goal_id" | "target_goal_id"> {
  return {
    source_goal_id: sourceGoalId,
    target_goal_id: targetGoalId,
  };
}

describe("checklist link suppression", () => {
  const ownerId = "owner-a";

  it("hides linked targets while upstream suppression is active on the viewed day", () => {
    const goals = [
      goal({ id: "source-a", title: "Create videos" }),
      goal({
        id: "target-b",
        title: "Post videos",
        start_date: "2026-01-01",
        end_date: null,
      }),
    ];
    const links = [link("source-a", "target-b")];

    expect(
      shouldHideLinkedTargetOnChecklistDate({
        goalId: "target-b",
        goals,
        links,
        ownerId,
        viewDate: "2026-09-04",
      })
    ).toBe(true);
    expect(
      selectChecklistHiddenLinkedTargetGoalIds({
        goals,
        links,
        ownerId,
        viewDate: "2026-09-04",
      })
    ).toEqual(new Set(["target-b"]));
  });

  it("shows linked targets again after upstream suppression resumes", () => {
    const goals = [
      goal({ id: "source-a", title: "Create videos" }),
      goal({
        id: "target-b",
        title: "Post videos",
        start_date: "2026-01-01",
        end_date: null,
      }),
    ];
    const links = [link("source-a", "target-b")];

    expect(
      selectChecklistHiddenLinkedTargetGoalIds({
        goals,
        links,
        ownerId,
        viewDate: "2026-10-01",
      })
    ).toEqual(new Set());
  });

  it("hides transitive targets in a linked chain", () => {
    const goals = [
      goal({ id: "source-a", title: "Create videos" }),
      goal({
        id: "target-b",
        title: "Edit videos",
        start_date: "2026-01-01",
        end_date: null,
      }),
      goal({
        id: "target-c",
        title: "Post videos",
        start_date: "2026-01-01",
        end_date: null,
      }),
    ];
    const links = [link("source-a", "target-b"), link("target-b", "target-c")];

    expect(
      selectChecklistHiddenLinkedTargetGoalIds({
        goals,
        links,
        ownerId,
        viewDate: "2026-09-04",
      })
    ).toEqual(new Set(["target-b", "target-c"]));
  });
});
