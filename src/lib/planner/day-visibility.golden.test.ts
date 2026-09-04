import { describe, expect, it } from "vitest";
import { buildEntriesByDate } from "@/features/planner/calendar-entries";
import {
  selectArchivedGoals,
  selectEndedGoals,
  selectFilteredTodayGoals,
} from "@/features/today/checklist-selectors";
import type { Goal } from "@/lib/goals/types";
import { selectSuppressedGoalIdsOnDate } from "@/lib/planner/link-suppression";
import type {
  PlannerActiveItemSnapshot,
  PlannerWorkUnit,
} from "@/features/planner/calendar-surface.types";

const OWNER_ID = "owner-a";
const VIEW_DATE = "2026-09-04";
const RESUME_DATE = "2026-10-01";

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
  const postVideos = goal({
    id: "post-videos",
    title: "Post videos",
    start_date: "2026-01-01",
    end_date: null,
  });
  const editVideos = goal({
    id: "edit-videos",
    title: "Edit videos",
    start_date: "2026-01-01",
    end_date: null,
  });
  const goals = [createVideos, postVideos];
  const links = [{ sourceGoalId: "create-videos", targetGoalId: "post-videos" }];

  it("hides Post videos on Today and calendar while Create videos suppresses September", () => {
    const suppressedGoalIds = selectSuppressedGoalIdsOnDate({
      goals,
      links,
      ownerId: OWNER_ID,
      date: VIEW_DATE,
    });

    expect(suppressedGoalIds).toEqual(new Set(["post-videos"]));
    expect(
      selectFilteredTodayGoals({
        activeGoals: goals,
        todayDate: VIEW_DATE,
        categoryFilters: [],
        recurrenceFilters: [],
        searchQuery: "",
        endMonths: [],
        hiddenLinkedTargetGoalIds: suppressedGoalIds,
      }).map((row) => row.id)
    ).toEqual(["create-videos"]);

    const previewUnit: PlannerWorkUnit = {
      originalGoalId: "post-videos",
      unitKey: "milestone:21",
      label: "Post videos",
      scheduledDate: VIEW_DATE,
      classification: "open",
      creditState: "uncredited",
    };
    const persistedItem: PlannerActiveItemSnapshot = {
      id: "item-post",
      plan_goal_id: "post-videos",
      unit_key: "milestone:21",
      requirement_kind: "deadline_total",
      scheduled_date: RESUME_DATE,
      original_scheduled_date: RESUME_DATE,
      locked: false,
      revision: 0,
    };
    const entriesByDate = buildEntriesByDate({
      workUnits: [previewUnit],
      activeItems: [persistedItem],
      activeGoalsByPlanGoalId: new Map(),
      activeGoalsByOriginalGoalId: new Map(),
      goalTitles: { "post-videos": "Post videos" },
      linkSummaries: [
        {
          sourceGoalId: "create-videos",
          targetGoalId: "post-videos",
          targetSuppressionKind: "until",
          targetResumesOn: RESUME_DATE,
        },
      ],
      draftItemEdits: {},
    });

    expect(entriesByDate.get(VIEW_DATE)).toBeUndefined();
    expect(entriesByDate.get(RESUME_DATE)?.[0]).toMatchObject({
      originalGoalId: "post-videos",
      creditState: "uncredited",
    });
  });

  it("does not render a preview-only Post videos session when prepare stored nothing", () => {
    const entriesByDate = buildEntriesByDate({
      workUnits: [
        {
          originalGoalId: "post-videos",
          unitKey: "milestone:21",
          label: "Post videos",
          scheduledDate: VIEW_DATE,
          classification: "open",
          creditState: "uncredited",
        },
      ],
      activeItems: [],
      activeGoalsByPlanGoalId: new Map(),
      activeGoalsByOriginalGoalId: new Map(),
      goalTitles: { "post-videos": "Post videos" },
      linkSummaries: [
        {
          sourceGoalId: "create-videos",
          targetGoalId: "post-videos",
          targetSuppressionKind: "until",
          targetResumesOn: RESUME_DATE,
        },
      ],
      draftItemEdits: {},
    });

    expect(entriesByDate.get(VIEW_DATE)).toBeUndefined();
    expect(entriesByDate.size).toBe(0);
  });

  it("hides the full A→B→C chain on both surfaces", () => {
    const chainGoals = [createVideos, editVideos, postVideos];
    const chainLinks = [
      { sourceGoalId: "create-videos", targetGoalId: "edit-videos" },
      { sourceGoalId: "edit-videos", targetGoalId: "post-videos" },
    ];
    const suppressedGoalIds = selectSuppressedGoalIdsOnDate({
      goals: chainGoals,
      links: chainLinks,
      ownerId: OWNER_ID,
      date: VIEW_DATE,
    });

    expect(suppressedGoalIds).toEqual(new Set(["edit-videos", "post-videos"]));
    expect(
      selectFilteredTodayGoals({
        activeGoals: chainGoals,
        todayDate: VIEW_DATE,
        categoryFilters: [],
        recurrenceFilters: [],
        searchQuery: "",
        endMonths: [],
        hiddenLinkedTargetGoalIds: suppressedGoalIds,
      }).map((row) => row.id)
    ).toEqual(["create-videos"]);
  });

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
