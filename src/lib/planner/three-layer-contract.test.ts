import { describe, expect, it } from "vitest";
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
import { toKernelWindow } from "@/lib/planner/dates";
import { evaluateGoalEligibility } from "@/lib/planner/eligibility";
import { runPlannerKernel, type PlannerKernelInput } from "@/lib/planner/kernel";
import {
  isFullySuppressedForWindow,
  isSuppressedOnDate,
  resolveLinkSuppression,
  selectSuppressedGoalIdsOnDate,
  toLinkSuppressionSource,
} from "@/lib/planner/link-suppression";
import { createDefaultPlannerPolicy } from "@/lib/planner/policy";
import { resolveWorkUnitDisplayDate } from "@/lib/planner/session-display-date";
import type { PlannerWorkUnit as KernelWorkUnit } from "@/lib/planner/work-units";

const OWNER_ID = "owner-a";
const VIEW_DATE = "2026-09-04";
const RESUME_DATE = "2026-10-01";
const SEPTEMBER = { start: "2026-09-01", end: "2026-09-30" };

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

function kernelInput(overrides: Partial<PlannerKernelInput> = {}): PlannerKernelInput {
  return {
    schemaVersion: "1",
    eligibilityMode: "overlap_v1",
    ownerId: OWNER_ID,
    ...toKernelWindow("2026-09"),
    asOfDate: VIEW_DATE,
    timezone: "UTC",
    goals: [],
    completions: [],
    links: [],
    policy: createDefaultPlannerPolicy("UTC", "2026-09-01T00:00:00Z"),
    basePlan: null,
    ...overrides,
  };
}

function todayVisibleIds(goals: Goal[], date: string, links: Array<{ sourceGoalId: string; targetGoalId: string }>) {
  const hiddenLinkedTargetGoalIds = selectSuppressedGoalIdsOnDate({
    goals,
    links,
    ownerId: OWNER_ID,
    date,
  });
  return selectFilteredTodayGoals({
    activeGoals: goals,
    todayDate: date,
    categoryFilters: [],
    recurrenceFilters: [],
    searchQuery: "",
    endMonths: [],
    hiddenLinkedTargetGoalIds,
  }).map((row) => row.id);
}

function calendarDates(args: Parameters<typeof buildEntriesByDate>[0]) {
  return [...buildEntriesByDate(args).keys()].sort();
}

function suppressionFor(goalId: string, goals: Goal[], links: Array<{ sourceGoalId: string; targetGoalId: string }>, asOfDate: string) {
  return resolveLinkSuppression({
    goalId,
    links,
    sourcesById: new Map(goals.map((row) => [row.id, toLinkSuppressionSource(row)])),
    ownerId: OWNER_ID,
    asOfDate,
  });
}

function prepareWouldSkipKernel({
  goalId,
  goals,
  links,
  asOfDate,
  preparationEnd,
}: {
  goalId: string;
  goals: Goal[];
  links: Array<{ sourceGoalId: string; targetGoalId: string }>;
  asOfDate: string;
  preparationEnd: string;
}) {
  return isSuppressedOnDate(
    suppressionFor(goalId, goals, links, asOfDate),
    preparationEnd
  );
}

function dateOutsideStoredLifetime(date: string, row: Pick<Goal, "start_date" | "end_date">) {
  return date < row.start_date || (row.end_date !== null && date > row.end_date);
}

function dbWriteWouldRejectLinkedTarget(date: string, source: Goal) {
  return (
    !source.is_deleted &&
    source.archived_at === null &&
    (source.end_date === null ||
      (source.end_date >= source.start_date && source.end_date >= date))
  );
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
  const links = [{ sourceGoalId: "create-videos", targetGoalId: "post-videos" }];
  const goals = [createVideos, postVideos];

  describe("linked target while the source still covers the date", () => {
    it("agrees across prepare skip, kernel eligibility, Today, and calendar", () => {
      const source = goal({ id: "source", title: "Source" });
      const target = goal({
        id: "target",
        title: "Target",
        start_date: "2026-01-01",
        end_date: null,
      });
      const pair = [source, target];
      const pairLinks = [{ sourceGoalId: "source", targetGoalId: "target" }];

      expect(
        prepareWouldSkipKernel({
          goalId: "target",
          goals: pair,
          links: pairLinks,
          asOfDate: VIEW_DATE,
          preparationEnd: SEPTEMBER.end,
        })
      ).toBe(true);
      expect(
        evaluateGoalEligibility({
          window: SEPTEMBER,
          ownerId: OWNER_ID,
          goal: target,
          currentLinkRole: isFullySuppressedForWindow(
            suppressionFor("target", pair, pairLinks, VIEW_DATE),
            SEPTEMBER
          )
            ? "target"
            : "none",
          asOfDate: VIEW_DATE,
        })
      ).toMatchObject({ eligible: false, reason: "linked_target" });

      const output = runPlannerKernel(
        kernelInput({
          goals: pair,
          links: pairLinks,
        })
      );
      expect(output.eligibility.find((entry) => entry.goalId === "target")).toMatchObject({
        eligible: false,
        reason: "linked_target",
      });
      expect(output.workUnits.every((unit) => unit.originalGoalId === "source")).toBe(
        true
      );
      expect(todayVisibleIds(pair, VIEW_DATE, pairLinks)).toEqual(["source"]);
      const projected = buildEntriesByDate({
        workUnits: output.workUnits.map((unit) => ({
          originalGoalId: unit.originalGoalId,
          unitKey: unit.unitKey,
          label: unit.label,
          scheduledDate: unit.scheduledDate,
          classification: unit.classification,
          creditState: unit.creditState,
        })),
        activeItems: [],
        activeGoalsByPlanGoalId: new Map(),
        activeGoalsByOriginalGoalId: new Map(),
        goalTitles: { source: "Source", target: "Target" },
        linkSummaries: [
          {
            sourceGoalId: "source",
            targetGoalId: "target",
            targetSuppressionKind: "until",
            targetResumesOn: RESUME_DATE,
          },
        ],
        draftItemEdits: {},
      });
      expect(
        [...projected.values()].flat().every((entry) => entry.originalGoalId === "source")
      ).toBe(true);
    });

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
  });

  describe("Today lists goals, Planner lists sessions", () => {
    it("keeps a source goal on Today even when Planner has no session that day", () => {
      expect(todayVisibleIds(goals, VIEW_DATE, links)).toEqual(["create-videos"]);
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
              original_goal_id: "create-videos",
              title: "Create videos",
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
    it("rejects dates outside the stored lifetime and allows the bounds", () => {
      expect(dateOutsideStoredLifetime("2026-08-31", createVideos)).toBe(true);
      expect(dateOutsideStoredLifetime("2026-09-01", createVideos)).toBe(false);
      expect(dateOutsideStoredLifetime("2026-09-30", createVideos)).toBe(false);
      expect(dateOutsideStoredLifetime("2026-10-01", createVideos)).toBe(true);
    });

    it("rejects completing the linked target while allowing the source", () => {
      expect(isSuppressedOnDate(suppressionFor("post-videos", goals, links, VIEW_DATE), VIEW_DATE)).toBe(
        true
      );
      expect(dbWriteWouldRejectLinkedTarget(VIEW_DATE, createVideos)).toBe(true);
      expect(isSuppressedOnDate(suppressionFor("create-videos", goals, links, VIEW_DATE), VIEW_DATE)).toBe(
        false
      );
      expect(dateOutsideStoredLifetime(VIEW_DATE, createVideos)).toBe(false);
    });

    it("allows the linked target after the stored source end_date", () => {
      expect(
        isSuppressedOnDate(
          suppressionFor("post-videos", goals, links, RESUME_DATE),
          RESUME_DATE
        )
      ).toBe(false);
      expect(dbWriteWouldRejectLinkedTarget(RESUME_DATE, createVideos)).toBe(false);
      expect(todayVisibleIds(goals, RESUME_DATE, links)).toEqual([
        "create-videos",
        "post-videos",
      ]);
    });

    it("keeps TS planning-horizon resume and DB stored-end suppression distinct for ordinal sources with no end_date", () => {
      const openOrdinalSource = goal({
        id: "open-source",
        title: "Open source",
        start_date: "2024-01-01",
        end_date: null,
        frequency_type: "fixed_milestones",
        target_count: 3,
        milestone_names: ["A", "B", "C"],
        target_basis: "lifetime",
      });
      const openTarget = goal({
        id: "open-target",
        title: "Open target",
        start_date: "2024-01-01",
        end_date: null,
      });
      const pair = [openOrdinalSource, openTarget];
      const pairLinks = [{ sourceGoalId: "open-source", targetGoalId: "open-target" }];
      const afterSoftHorizon = "2028-09-01";

      expect(
        isSuppressedOnDate(suppressionFor("open-target", pair, pairLinks, VIEW_DATE), VIEW_DATE)
      ).toBe(true);
      expect(dbWriteWouldRejectLinkedTarget(VIEW_DATE, openOrdinalSource)).toBe(true);
      expect(
        isSuppressedOnDate(
          suppressionFor("open-target", pair, pairLinks, VIEW_DATE),
          afterSoftHorizon
        )
      ).toBe(false);
      expect(dbWriteWouldRejectLinkedTarget(afterSoftHorizon, openOrdinalSource)).toBe(
        true
      );
    });
  });
});
