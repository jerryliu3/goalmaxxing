import { describe, expect, it } from "vitest";
import {
  selectArchivedGoals,
  selectEndedGoals,
} from "@/features/today/checklist-selectors";
import type { Goal } from "@/lib/goals/types";

const OWNER_ID = "owner-a";

function goal(overrides: Partial<Goal> & Pick<Goal, "id" | "title">): Goal {
  return {
    owner_id: OWNER_ID,
    description: null,
    category: "career",
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

describe("day visibility golden vectors (Sept 4 Post videos)", () => {
  const createVideos = goal({ id: "create-videos", title: "Create videos" });
  it("keeps ended and archived linked targets in history panels", () => {
    const endedPost = goal({
      id: "post-videos",
      title: "Post videos",
      start_date: "2026-01-01",
      end_date: "2026-08-31",
    });
    const archivedPost = goal({
      id: "post-videos-archived",
      title: "Post videos archived",
      start_date: "2026-01-01",
      end_date: null,
      archived_at: "2026-08-01T00:00:00Z",
    });

    expect(
      selectEndedGoals({
        completableGoals: [createVideos, endedPost],
        lifecycleByGoalAtViewDate: new Map([
          ["create-videos", "active"],
          ["post-videos", "ended"],
        ]),
      }).map((row) => row.id)
    ).toEqual(["post-videos"]);
    expect(selectArchivedGoals([createVideos, archivedPost]).map((row) => row.id)).toEqual([
      "post-videos-archived",
    ]);
  });
});
