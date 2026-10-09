import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildEntriesByDate } from "@/features/planner/calendar-entries";
import { isEntryCredited } from "@/features/planner/calendar-format";
import type {
  PlannerActiveItemSnapshot,
  PlannerWorkUnit,
} from "@/features/planner/calendar-surface.types";
import {
  selectArchivedGoals,
  selectEndedGoals,
  selectFilteredTodayGoals,
} from "@/features/today/checklist-selectors";
import { withLifetimeTargetBasisForTests } from "@/lib/goals/goal-test-fixtures";
import type { Goal } from "@/lib/goals/types";
import { detectActivePlanReconciliationMismatches } from "@/lib/planner/active-plan-reconciliation";
import {
  applyPlannerGoalDateFact,
  mapCompletionRpcError,
} from "@/lib/planner/exact-date-dispatch";
import { resolveWorkUnitDisplayDate } from "@/lib/planner/session-display-date";
import type { PlannerWorkUnit as KernelWorkUnit } from "@/lib/planner/work-units";

const OWNER_ID = "owner-a";
const VIEW_DATE = "2026-09-04";
const RESUME_DATE = "2026-10-01";

function goal(overrides: Partial<Goal> & Pick<Goal, "id" | "title">): Goal {
  return withLifetimeTargetBasisForTests(
    {
      owner_id: OWNER_ID,
      description: null,
      category: "career",
      color: null,
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 2,
      milestone_names: null,
      start_date: "2026-09-01",
      end_date: "2026-09-30",
      photo_path: null,
      team_id: null,
      is_deleted: false,
      archived_at: null,
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-09-01T00:00:00Z",
      target_basis: "lifetime",
      ...overrides,
    },
    overrides
  );
}

function todayVisibleIds(goals: Goal[], date: string) {
  return selectFilteredTodayGoals({
    activeGoals: goals,
    todayDate: date,
    categoryFilters: [],
    recurrenceFilters: [],
    searchQuery: "",
    endMonths: [],
  }).map((row) => row.id);
}

function calendarDates(args: Parameters<typeof buildEntriesByDate>[0]) {
  return [...buildEntriesByDate(args).keys()].sort();
}

const GOAL_DISPATCH_DIGEST =
  "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

function goalLifetime(row: Pick<Goal, "start_date" | "end_date">) {
  return { startDate: row.start_date, endDate: row.end_date };
}

async function dispatchGoalCompletionWrite({
  goalId,
  date,
  lifetime,
}: {
  goalId: string;
  date: string;
  lifetime: Pick<Goal, "start_date" | "end_date">;
}) {
  const rpc = vi
    .fn()
    .mockResolvedValueOnce({
      data: GOAL_DISPATCH_DIGEST,
      error: null,
    })
    .mockResolvedValueOnce({ data: null, error: null });
  const supabase = {
    rpc,
    from: vi.fn(() => {
      throw new Error("linked suppression lookup should not run");
    }),
  } as unknown as Parameters<typeof applyPlannerGoalDateFact>[0]["supabase"];

  const result = await applyPlannerGoalDateFact({
    supabase,
    goalId,
    date,
    desiredFactState: "present",
    timezone: "UTC",
    goalLifetime: goalLifetime(lifetime),
    expectation: { expectedDigest: GOAL_DISPATCH_DIGEST },
  });

  return { result, rpc };
}

describe("prepare / kernel / projection contract", () => {
  const createVideos = goal({
    id: "create-videos",
    title: "Create videos",
    frequency_type: "recurring",
    recurrence_interval: "daily",
    target_count: null,
    target_basis: "period",
  });
  const postVideos = goal({
    id: "post-videos",
    title: "Post videos",
    start_date: "2026-01-01",
    end_date: null,
    frequency_type: "recurring",
    recurrence_interval: "daily",
    target_count: null,
    target_basis: "period",
  });
  const goals = [createVideos, postVideos];

  describe("linked target session projection", () => {
    it("still hides a kernel preview unit when prepare stored no planner_item", () => {
      const previewUnit: PlannerWorkUnit = {
        originalGoalId: "post-videos",
        unitKey: "total:1",
        label: "Post videos",
        scheduledDate: VIEW_DATE,
        classification: "open",
        creditState: "uncredited",
      };
      const entriesByDate = buildEntriesByDate({
        workUnits: [previewUnit],
        activeItems: [],
        activeGoalsByPlanGoalId: new Map(),
        activeGoalsByOriginalGoalId: new Map(),
        goalTitles: { "post-videos": "Post videos" },
        draftItemEdits: {},
      });
      expect(entriesByDate.size).toBe(0);
      expect(
        resolveWorkUnitDisplayDate({
          creditState: "uncredited",
          persistedScheduledDate: null,
          previewScheduledDate: VIEW_DATE,
        })
      ).toBeNull();
    });

    it("pins an uncredited persisted session to the DB date, not the preview date", () => {
      const persistedItem: PlannerActiveItemSnapshot = {
        id: "item-post",
        plan_goal_id: "post-videos",
        unit_key: "total:1",
        requirement_kind: "deadline_total",
        scheduled_date: RESUME_DATE,
        locked: false,
        revision: 0,
      };
      const entriesByDate = buildEntriesByDate({
        workUnits: [
          {
            originalGoalId: "post-videos",
            unitKey: "total:1",
            label: "Post videos",
            scheduledDate: VIEW_DATE,
            classification: "open",
            creditState: "uncredited",
          },
        ],
        activeItems: [persistedItem],
        activeGoalsByPlanGoalId: new Map(),
        activeGoalsByOriginalGoalId: new Map(),
        goalTitles: { "post-videos": "Post videos" },
        draftItemEdits: {},
      });
      expect(entriesByDate.get(VIEW_DATE)).toBeUndefined();
      expect(entriesByDate.get(RESUME_DATE)?.[0]).toMatchObject({
        originalGoalId: "post-videos",
        creditState: "uncredited",
      });
    });
  });

  describe("Today lists goals, Planner lists sessions", () => {
    it("keeps a source goal on Today even when Planner has no session that day", () => {
      expect(todayVisibleIds(goals, VIEW_DATE)).toEqual(["create-videos", "post-videos"]);
      expect(
        calendarDates({
          workUnits: [],
          activeItems: [],
          activeGoalsByPlanGoalId: new Map(),
          activeGoalsByOriginalGoalId: new Map(),
          goalTitles: { "create-videos": "Create videos" },
          draftItemEdits: {},
        })
      ).toEqual([]);
    });

    it("does not hide ended or archived linked targets from history panels", () => {
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
      expect(
        selectArchivedGoals([createVideos, archivedPost]).map((row) => row.id)
      ).toEqual(["post-videos-archived"]);
    });
  });

  describe("credit lives on work units, not snapshot identity", () => {
    it("paints credited history from a work unit even when no snapshot item exists", () => {
      const entriesByDate = buildEntriesByDate({
        workUnits: [
          {
            originalGoalId: "create-videos",
            unitKey: "total:1",
            label: "Create videos",
            scheduledDate: "2026-08-20",
            classification: "fulfilled",
            creditState: "completed_as_scheduled",
          },
        ],
        activeItems: [],
        activeGoalsByPlanGoalId: new Map(),
        activeGoalsByOriginalGoalId: new Map(),
        goalTitles: { "create-videos": "Create videos" },
        draftItemEdits: {},
      });
      const entry = entriesByDate.get("2026-08-20")?.[0];
      expect(entry).toMatchObject({
        classification: "fulfilled",
        creditState: "completed_as_scheduled",
      });
      expect(isEntryCredited(entry!)).toBe(true);
    });

    it("fails closed to uncredited when a persisted item has no matching work unit", () => {
      const entriesByDate = buildEntriesByDate({
        workUnits: [],
        activeItems: [
          {
            id: "item-orphan",
            plan_goal_id: "create-videos",
            unit_key: "total:1",
            requirement_kind: "deadline_total",
            scheduled_date: "2026-09-10",
            locked: false,
            revision: 0,
          },
        ],
        activeGoalsByPlanGoalId: new Map([
          [
            "create-videos",
            {
              id: "create-videos",
              goal_id: "create-videos",
              original_goal_id: "create-videos",
              requirement_fingerprint: "deadline_total:1",
              title: "Create videos",
              category: "creative",
              color: null,
            },
          ],
        ]),
        activeGoalsByOriginalGoalId: new Map(),
        goalTitles: { "create-videos": "Create videos" },
        draftItemEdits: {},
      });
      expect(entriesByDate.get("2026-09-10")?.[0]).toMatchObject({
        classification: "open",
        creditState: "uncredited",
      });
    });

    it("reports only snapshot items that have no work unit", () => {
      const item: PlannerActiveItemSnapshot = {
        id: "item-1",
        plan_goal_id: "pg-1",
        unit_key: "total:1",
        requirement_kind: "deadline_total",
        scheduled_date: "2026-09-10",
        locked: false,
        revision: 0,
      };
      const creditedUnit: KernelWorkUnit = {
        originalGoalId: "create-videos",
        requirementSchemaVersion: "1",
        requirementFingerprint: "fp",
        unitKey: "total:2",
        kind: "deadline_total",
        ordinal: 2,
        periodKey: null,
        label: "Create videos",
        creditWindow: { start: "2026-09-01", end: "2026-09-30" },
        placementWindow: null,
        draftMoveWindow: null,
        classification: "fulfilled",
        missPolicy: "roll_forward",
        restEligible: true,
        maxPerDay: 1,
        creditedCompletionId: "completion-1",
        creditedCompletionDate: "2026-08-20",
        creditState: "completed_as_scheduled",
        scheduledDate: "2026-08-20",
        locked: false,
      };
      expect(
        detectActivePlanReconciliationMismatches({
          items: [item],
          workUnits: [creditedUnit],
          goalIdByPlanGoalId: new Map([["pg-1", "create-videos"]]),
        })
      ).toEqual([
        {
          entryKey: "create-videos:total:1",
          planId: null,
          planGoalId: "pg-1",
          unitKey: "total:1",
          reason: "missing_work_unit",
        },
      ]);
      expect(
        detectActivePlanReconciliationMismatches({
          items: [],
          workUnits: [creditedUnit],
          goalIdByPlanGoalId: new Map(),
        })
      ).toEqual([]);
    });
  });

  describe("completion write matrix", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(`${VIEW_DATE}T12:00:00.000Z`));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("rejects dates outside the stored lifetime before calling mark_goal_complete", async () => {
      const beforeStart = await dispatchGoalCompletionWrite({
        goalId: createVideos.id,
        date: "2026-08-31",
        lifetime: createVideos,
      });
      expect(beforeStart.result).toMatchObject({
        ok: false,
        status: 422,
        code: "completion_outside_goal_lifetime",
      });
      expect(beforeStart.rpc).toHaveBeenCalledTimes(1);
      expect(beforeStart.rpc).toHaveBeenCalledWith("get_planner_schedule_digest", {});

      const startBound = await dispatchGoalCompletionWrite({
        goalId: createVideos.id,
        date: "2026-09-01",
        lifetime: createVideos,
      });
      expect(startBound.result).toMatchObject({
        ok: true,
        payload: { goalId: createVideos.id, date: "2026-09-01", factState: "present" },
      });
      expect(startBound.rpc).toHaveBeenLastCalledWith("mark_goal_complete", {
        p_goal_id: createVideos.id,
        p_date: "2026-09-01",
      });

      vi.setSystemTime(new Date("2026-09-30T12:00:00.000Z"));
      const endBound = await dispatchGoalCompletionWrite({
        goalId: createVideos.id,
        date: "2026-09-30",
        lifetime: createVideos,
      });
      expect(endBound.result).toMatchObject({
        ok: true,
        payload: { goalId: createVideos.id, date: "2026-09-30", factState: "present" },
      });
      expect(endBound.rpc).toHaveBeenLastCalledWith("mark_goal_complete", {
        p_goal_id: createVideos.id,
        p_date: "2026-09-30",
      });

      vi.setSystemTime(new Date("2026-10-01T12:00:00.000Z"));
      const afterEnd = await dispatchGoalCompletionWrite({
        goalId: createVideos.id,
        date: "2026-10-01",
        lifetime: createVideos,
      });
      expect(afterEnd.result).toMatchObject({
        ok: false,
        status: 422,
        code: "completion_outside_goal_lifetime",
      });
      expect(afterEnd.rpc).not.toHaveBeenCalledWith(
        "mark_goal_complete",
        expect.anything()
      );
    });

    it("keeps linked targets visible and directly completable", async () => {
      expect(todayVisibleIds(goals, VIEW_DATE)).toEqual(["create-videos", "post-videos"]);

      const write = await dispatchGoalCompletionWrite({
        goalId: postVideos.id,
        date: VIEW_DATE,
        lifetime: postVideos,
      });
      expect(write.result).toEqual({
        ok: true,
        payload: {
          goalId: postVideos.id,
          date: VIEW_DATE,
          factState: "present",
        },
      });
      expect(write.rpc).toHaveBeenLastCalledWith("mark_goal_complete", {
        p_goal_id: postVideos.id,
        p_date: VIEW_DATE,
      });
      expect(
        mapCompletionRpcError({
          code: "23514",
          message: "linked_goal_disallowed",
        })
      ).toBeNull();
    });

    it("uses stored lifetime rather than a planning horizon for direct completion", async () => {
      const openTarget = goal({
        id: "open-target",
        title: "Open target",
        start_date: "2024-01-01",
        end_date: null,
      });
      const currentCompletion = await dispatchGoalCompletionWrite({
        goalId: openTarget.id,
        date: VIEW_DATE,
        lifetime: openTarget,
      });
      expect(currentCompletion.result).toMatchObject({ ok: true });
      expect(currentCompletion.rpc).toHaveBeenLastCalledWith("mark_goal_complete", {
        p_goal_id: openTarget.id,
        p_date: VIEW_DATE,
      });

      const afterHorizon = await dispatchGoalCompletionWrite({
        goalId: openTarget.id,
        date: "2028-09-01",
        lifetime: openTarget,
      });
      expect(afterHorizon.result).toMatchObject({
        ok: false,
        status: 422,
        code: "future_completion_not_allowed",
      });
      expect(afterHorizon.rpc).not.toHaveBeenCalledWith(
        "mark_goal_complete",
        expect.anything()
      );
    });
  });
});
