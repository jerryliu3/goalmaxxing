import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompletionCreditMoveProvider } from "@/features/planner/completion-credit-move";
import { PlanDayUnplannedPanel } from "@/features/planner/plan-day-unplanned-panel";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import type { PlanDayChecklistModel } from "@/features/planner/use-plan-day-checklist-model";
import type { PlannerContextPayload } from "@cadence/shared/planner/context";

const checklistDataMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/today/use-checklist-data", () => ({
  useChecklistData: () => checklistDataMock(),
}));

vi.mock("@/features/today/use-checklist-completion-actions", () => ({
  useChecklistCompletionActions: () => ({
    savingGoalId: null,
    recentlyCompletedGoalId: null,
    toggleCompletion: vi.fn(),
  }),
}));

const goal = buildGoal({
  id: "goal-run",
  title: "Tempo run",
});

function checklistModel(): PlanDayChecklistModel {
  return {
    listModel: {
      completableGoals: [goal],
      presentationByGoalId: new Map([["goal-run", { exactDateCompleted: false }]]),
    },
    visibleGoalIds: null,
    loading: false,
    data: { goals: [goal] },
    todayLocalDate: "2026-08-12",
    toggleCompletion: vi.fn(),
  } as unknown as PlanDayChecklistModel;
}

function plannerContext(): PlannerContextPayload {
  return {
    schemaVersion: "1",
    scopeMonth: "2026-08",
    asOfDate: "2026-08-12",
    timezone: "UTC",
    goalTitles: { "goal-run": "Tempo run" },
    links: [],
    preferences: null,
    capabilities: { crossMonthMovesEnabled: true },
    activePlan: null,
    preview: {
      eligibilityMode: "overlap_v1",
      preserveExistingAssignments: true,
      generationInputHash: "a".repeat(64),
      solver: {
        placementStatus: "complete",
        searchStatus: "all_units_placed",
        capacityStatus: "unverified",
        issueCodes: [],
        invalidGoalIds: [],
        publishable: true,
        confirmationRequired: false,
      },
      workUnits: [
        {
          originalGoalId: "goal-run",
          unitKey: "cadence:2026-08-01:1",
          kind: "cadence",
          label: null,
          scheduledDate: "2026-08-20",
          creditState: "uncredited",
          classification: "open",
          locked: false,
          creditWindow: { start: "2026-08-01", end: "2026-08-31" },
          draftMoveWindow: { start: "2026-08-12", end: "2026-08-31" },
        },
      ],
    },
    revisions: {
      canonicalRevision: 1,
      executionRevision: 1,
      scheduleDigest: "b".repeat(64),
    },
    staleness: { stale: false, reasons: [] },
  };
}

describe("PlanDayUnplannedPanel credit move", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows a move arrow when an unplanned goal has a placed session elsewhere", () => {
    render(
      <CompletionCreditMoveProvider context={plannerContext()}>
        <PlanDayUnplannedPanel
          day="2026-08-12"
          placedEntries={[]}
          checklist={checklistModel()}
        />
      </CompletionCreditMoveProvider>
    );

    expect(
      screen.getByRole("button", {
        name: "Move a planned session to complete Tempo run",
      })
    ).toBeTruthy();
  });

  it("shows a move arrow for a future day when a session can be moved there", () => {
    render(
      <CompletionCreditMoveProvider context={plannerContext()}>
        <PlanDayUnplannedPanel
          day="2026-08-18"
          placedEntries={[]}
          checklist={checklistModel()}
        />
      </CompletionCreditMoveProvider>
    );

    expect(
      screen.getByRole("button", {
        name: "Move a planned session to complete Tempo run",
      })
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Mark Tempo run done" })
    ).toBeNull();
  });

  it("shows a completion checkbox on past days instead of a move arrow", () => {
    render(
      <CompletionCreditMoveProvider context={plannerContext()}>
        <PlanDayUnplannedPanel
          day="2026-08-06"
          placedEntries={[]}
          checklist={checklistModel()}
        />
      </CompletionCreditMoveProvider>
    );

    expect(screen.getByRole("button", { name: "Mark Tempo run done" })).toBeTruthy();
    expect(
      screen.queryByRole("button", {
        name: "Move a planned session to complete Tempo run",
      })
    ).toBeNull();
  });
});
