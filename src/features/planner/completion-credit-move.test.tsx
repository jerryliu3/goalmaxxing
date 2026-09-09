import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompletionCreditMoveProvider, useCompletionCreditMove } from "@/features/planner/completion-credit-move";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import type { PlannerContextPayload } from "@cadence/shared/planner/context";

const persistImmediatePlannerMove = vi.hoisted(() => vi.fn());

vi.mock("@/lib/planner/persist-immediate-move", () => ({
  persistImmediatePlannerMove: (...args: unknown[]) =>
    persistImmediatePlannerMove(...args),
}));

const goal = buildGoal({
  id: "goal-run",
  title: "Tempo run",
});

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

function Probe() {
  const creditMove = useCompletionCreditMove();
  return (
    <button
      type="button"
      onClick={() => {
        void creditMove?.requestMoveBeforeComplete(goal, "2026-08-12");
      }}
    >
      Open move
    </button>
  );
}

describe("CompletionCreditMoveProvider", () => {
  afterEach(() => {
    cleanup();
    persistImmediatePlannerMove.mockReset();
  });

  it("opens the move dialog and persists immediately on save", async () => {
    persistImmediatePlannerMove.mockResolvedValue(undefined);
    render(
      <CompletionCreditMoveProvider context={plannerContext()}>
        <Probe />
      </CompletionCreditMoveProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open move" }));
    expect(await screen.findByRole("heading", { name: /Move session here/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(persistImmediatePlannerMove).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: goal.id,
          unitKey: "cadence:2026-08-01:1",
          sourceDate: "2026-08-20",
          scheduledDate: "2026-08-12",
        })
      );
    });
  });
});
