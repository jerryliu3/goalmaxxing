import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useChecklistCompletionActions } from "./use-checklist-completion-actions";
import type { Goal } from "@/lib/goals/types";

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@/features/planner/use-completion-mutation", () => ({ useCompletionMutation: () => mocks.mutate }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/social/duo/telemetry", () => ({ reportDuoTelemetry: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); });

const goal: Goal = {
  id: "goal-1", owner_id: "me", title: "Run", description: null, category: "health",
  color: null, frequency_type: "recurring", recurrence_interval: "daily", target_count: null,
  target_basis: "period", milestone_names: null, start_date: "2026-08-01", end_date: null,
  photo_path: null, team_id: null, is_deleted: false, archived_at: null,
  created_at: "2026-08-01T00:00:00Z", updated_at: "2026-08-01T00:00:00Z",
};

function mount() {
  return renderHook(() => useChecklistCompletionActions({
    readOnly: false, viewDate: "2026-08-12", todayLocalDate: "2026-08-12", timezone: "UTC",
    completionsByGoal: new Map(),
  }));
}

it("preserves the saved optimistic fact without its own refresh-failure toast", async () => {
  mocks.mutate.mockResolvedValue({ ok: true, message: null });
  const { result, unmount } = mount();
  await act(async () => { await result.current.toggleCompletion(goal, document.createElement("button")); });
  expect(mocks.mutate).toHaveBeenCalledTimes(1);
  expect(result.current.optimisticFacts.get("goal-1:2026-08-12")).toBe(true);
  expect(result.current.savingGoalId).toBeNull();
  expect(toast.error).not.toHaveBeenCalled();
  unmount();
});

it("reports a rejected save and rolls back its optimistic fact", async () => {
  mocks.mutate.mockResolvedValue({ ok: false, message: "Save rejected." });
  const { result, unmount } = mount();
  await act(async () => { await result.current.toggleCompletion(goal, document.createElement("button")); });
  expect(result.current.optimisticFacts.size).toBe(0);
  expect(toast.error).toHaveBeenCalledWith("Save rejected.");
  unmount();
});
