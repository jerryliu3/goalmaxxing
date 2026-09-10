import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompletionCreditMoveProvider, useCompletionCreditMove } from "@/features/planner/completion-credit-move";
import { useChecklistCompletionActions } from "@/features/today/use-checklist-completion-actions";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import type { PlannerContextPayload } from "@cadence/shared/planner/context";

const persistImmediatePlannerMove = vi.hoisted(() => vi.fn());
const runCompletionMutation = vi.hoisted(() => vi.fn());

vi.mock("@/lib/planner/persist-immediate-move", () => ({
  persistImmediatePlannerMove: (...args: unknown[]) =>
    persistImmediatePlannerMove(...args),
}));

vi.mock("@/features/planner/use-completion-mutation", () => ({
  useCompletionMutation: () => runCompletionMutation,
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
          label: "Tempo run",
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

function ChecklistProbe() {
  const { toggleCompletion } = useChecklistCompletionActions({
    readOnly: false,
    viewDate: "2026-08-12",
    todayLocalDate: "2026-08-12",
    completionsByGoal: new Map(),
    loadData: async () => undefined,
    redirectToLogin: () => undefined,
  });
  return (
    <button
      type="button"
      onClick={(event) => {
        void toggleCompletion(goal, event.currentTarget);
      }}
    >
      Complete
    </button>
  );
}

describe("CompletionCreditMoveProvider", () => {
  afterEach(() => {
    cleanup();
    persistImmediatePlannerMove.mockReset();
    runCompletionMutation.mockReset();
  });

  it("opens the move dialog and persists immediately on save", async () => {
    persistImmediatePlannerMove.mockResolvedValue(undefined);
    render(
      <CompletionCreditMoveProvider context={plannerContext()}>
        <Probe />
      </CompletionCreditMoveProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open move" }));
    expect(await screen.findByRole("heading", { name: /Schedule this goal for/i })).toBeTruthy();
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

  it("opens the move dialog instead of completing when draft staging is unavailable", async () => {
    render(
      <CompletionCreditMoveProvider context={plannerContext()}>
        <ChecklistProbe />
      </CompletionCreditMoveProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    expect(await screen.findByRole("heading", { name: /Schedule this goal for/i })).toBeTruthy();
    expect(
      screen.getByText(
        "This schedules the goal on this day by moving it from another planned slot."
      )
    ).toBeTruthy();
    expect(runCompletionMutation).not.toHaveBeenCalled();
  });

  it("auto-stages a draft move in day view without opening the dialog", async () => {
    const onDraftMove = vi.fn(() => true);
    render(
      <CompletionCreditMoveProvider
        context={plannerContext()}
        viewMode="day"
        onDraftMove={onDraftMove}
      >
        <ChecklistProbe />
      </CompletionCreditMoveProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    await waitFor(() => {
      expect(onDraftMove).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: goal.id,
          unitKey: "cadence:2026-08-01:1",
          sourceDate: "2026-08-20",
          scheduledDate: "2026-08-12",
        })
      );
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(runCompletionMutation).not.toHaveBeenCalled();
    expect(persistImmediatePlannerMove).not.toHaveBeenCalled();
  });

  it("auto-stages a draft move in week view without opening the dialog", async () => {
    const onDraftMove = vi.fn(() => true);
    render(
      <CompletionCreditMoveProvider
        context={plannerContext()}
        viewMode="week"
        onDraftMove={onDraftMove}
      >
        <ChecklistProbe />
      </CompletionCreditMoveProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    await waitFor(() => {
      expect(onDraftMove).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: goal.id,
          unitKey: "cadence:2026-08-01:1",
          sourceDate: "2026-08-20",
          scheduledDate: "2026-08-12",
        })
      );
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(runCompletionMutation).not.toHaveBeenCalled();
    expect(persistImmediatePlannerMove).not.toHaveBeenCalled();
  });

  it("blocks week auto-draft when the draft move window excludes the completion date", async () => {
    const onDraftMove = vi.fn(() => true);
    const context = plannerContext();
    context.preview!.workUnits[0]!.draftMoveWindow = {
      start: "2026-08-20",
      end: "2026-08-31",
    };
    render(
      <CompletionCreditMoveProvider
        context={context}
        viewMode="week"
        onDraftMove={onDraftMove}
      >
        <ChecklistProbe />
      </CompletionCreditMoveProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    await waitFor(() => {
      expect(onDraftMove).not.toHaveBeenCalled();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(runCompletionMutation).not.toHaveBeenCalled();
  });

  it("auto-stages the default session in week view when multiple sessions can be moved", async () => {
    const onDraftMove = vi.fn(() => true);
    const context = plannerContext();
    context.preview!.workUnits.push({
      originalGoalId: "goal-run",
      unitKey: "cadence:2026-08-01:2",
      kind: "cadence",
      label: "Tempo run",
      scheduledDate: "2026-08-18",
      creditState: "uncredited",
      classification: "open",
      locked: false,
      creditWindow: { start: "2026-08-01", end: "2026-08-31" },
      draftMoveWindow: { start: "2026-08-12", end: "2026-08-31" },
    });
    render(
      <CompletionCreditMoveProvider
        context={context}
        viewMode="week"
        onDraftMove={onDraftMove}
      >
        <ChecklistProbe />
      </CompletionCreditMoveProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    await waitFor(() => {
      expect(onDraftMove).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onDraftMove).toHaveBeenCalledWith(
      expect.objectContaining({
        goalId: goal.id,
        scheduledDate: "2026-08-12",
      })
    );
    expect(persistImmediatePlannerMove).not.toHaveBeenCalled();
  });

  it("completes unscheduled goals on past days instead of moving a session", async () => {
    runCompletionMutation.mockResolvedValue({ ok: true, message: null });
    function PastChecklistProbe() {
      const { toggleCompletion } = useChecklistCompletionActions({
        readOnly: false,
        viewDate: "2026-08-06",
        todayLocalDate: "2026-08-12",
        completionsByGoal: new Map(),
        loadData: async () => undefined,
        redirectToLogin: () => undefined,
      });
      return (
        <button
          type="button"
          onClick={(event) => {
            void toggleCompletion(goal, event.currentTarget);
          }}
        >
          Complete past
        </button>
      );
    }

    render(
      <CompletionCreditMoveProvider context={plannerContext()} onDraftMove={vi.fn()}>
        <PastChecklistProbe />
      </CompletionCreditMoveProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete past" }));
    await waitFor(() => {
      expect(runCompletionMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          date: "2026-08-06",
          desiredFactState: "present",
          goalId: goal.id,
        })
      );
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(persistImmediatePlannerMove).not.toHaveBeenCalled();
  });

  it("auto-stages a draft move onto a future day", async () => {
    const onDraftMove = vi.fn(() => true);
    function FutureChecklistProbe() {
      const { toggleCompletion } = useChecklistCompletionActions({
        readOnly: false,
        viewDate: "2026-08-18",
        todayLocalDate: "2026-08-12",
        completionsByGoal: new Map(),
        loadData: async () => undefined,
        redirectToLogin: () => undefined,
      });
      return (
        <button
          type="button"
          onClick={(event) => {
            void toggleCompletion(goal, event.currentTarget);
          }}
        >
          Schedule future
        </button>
      );
    }

    render(
      <CompletionCreditMoveProvider
        context={plannerContext()}
        onDraftMove={onDraftMove}
      >
        <FutureChecklistProbe />
      </CompletionCreditMoveProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Schedule future" }));
    await waitFor(() => {
      expect(onDraftMove).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: goal.id,
          sourceDate: "2026-08-20",
          scheduledDate: "2026-08-18",
        })
      );
    });
    expect(runCompletionMutation).not.toHaveBeenCalled();
    expect(persistImmediatePlannerMove).not.toHaveBeenCalled();
  });
});
