import { describe, expect, it, vi } from "vitest";
import { persistImmediatePlannerMove } from "@/lib/planner/persist-immediate-move";
import type { PlannerContextPayload } from "@cadence/shared/planner/context";

const postJson = vi.fn();

vi.mock("@/lib/api/client", () => ({
  getApiErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback,
  postJson: (...args: unknown[]) => postJson(...args),
}));

function context(): PlannerContextPayload {
  return {
    schemaVersion: "1",
    scopeMonth: "2026-08",
    asOfDate: "2026-08-12",
    timezone: "UTC",
    goalTitles: {},
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
          unitKey: "cadence:1",
          scheduledDate: "2026-08-20",
          creditState: "uncredited",
          classification: "open",
        },
      ],
    },
    revisions: {
      canonicalRevision: 1,
      executionRevision: 1,
      scheduleDigest: "c".repeat(64),
    },
    staleness: { stale: false, reasons: [] },
  };
}

describe("persistImmediatePlannerMove", () => {
  it("posts a single move_item command to planner save", async () => {
    postJson.mockResolvedValueOnce({ replayed: false });
    await persistImmediatePlannerMove({
      context: context(),
      goalId: "22222222-2222-4222-8222-222222222222",
      unitKey: "cadence:1",
      sourceDate: "2026-08-20",
      scheduledDate: "2026-08-12",
    });
    expect(postJson).toHaveBeenCalledWith(
      "/api/planner/save",
      expect.objectContaining({
        expectedDigest: "c".repeat(64),
        startDate: "2026-08-01",
        endDate: "2026-08-31",
        draftCommands: [
          expect.objectContaining({
            kind: "move_item",
            unitKey: "cadence:1",
            sourceDate: "2026-08-20",
            scheduledDate: "2026-08-12",
          }),
        ],
      })
    );
  });
});
