import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { usePlannerEntryMutations } from "./use-planner-entry-mutations";
import { buildPlannerContext, buildPlannerDayEntry } from "./test-fixtures";
import type { OptimisticCompletionFacts } from "@/lib/planner/optimistic-completion-facts";

vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
beforeEach(() => vi.clearAllMocks());

function mount(ok: boolean) {
  let overlay: OptimisticCompletionFacts = new Map();
  const args = {
    context: buildPlannerContext(), hasDraftSession: false, draftSaveCommands: [],
    effectiveDraftPolicy: null, effectiveDraftItemEdits: {}, effectiveSelectedDay: "2026-08-01",
    setMutationLoadingKey: vi.fn(),
    setOptimisticCompletionFacts: vi.fn((next: import("react").SetStateAction<OptimisticCompletionFacts>) => {
      overlay = typeof next === "function" ? next(overlay) : next;
    }),
    getDateFactDispatchForEntry: () => ({
      currentlyCredited: false, desiredFactState: "present" as const,
      decision: { allowed: true, route: "canonical_exact_date", exactDateOnly: true, reason: "allowed" } as const,
    }),
    completionControlDisabledReasonForEntry: () => null,
    runCompletionMutation: vi.fn(async () => ({ ok, message: ok ? null : "Save rejected." })),
    handlePlannerMutation: vi.fn(),
    loadContext: vi.fn(async () => "failed" as const),
    refreshDraftPreview: vi.fn(async () => null),
  };
  return { ...renderHook(() => usePlannerEntryMutations(args)), args, overlay: () => overlay };
}

it("keeps a saved checkmark without a second refresh or a refresh-failure toast", async () => {
  const { result, args, overlay } = mount(true);
  await act(async () => { await result.current.toggleDateFact(buildPlannerDayEntry()); });
  expect(args.runCompletionMutation).toHaveBeenCalledTimes(1);
  expect(args.handlePlannerMutation).not.toHaveBeenCalled();
  expect(args.loadContext).not.toHaveBeenCalled();
  expect(overlay().get("goal-1:2026-08-01")).toBe(true);
  expect(toast.error).not.toHaveBeenCalled();
});

it("rolls back the checkmark and reports a real write failure", async () => {
  const { result, overlay } = mount(false);
  await act(async () => { await result.current.toggleDateFact(buildPlannerDayEntry()); });
  expect(overlay().size).toBe(0);
  expect(toast.error).toHaveBeenCalledWith("Save rejected.");
});
