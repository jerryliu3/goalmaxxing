import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPlannerContext } from "@/features/planner/test-fixtures";
import { usePlannerPersistenceActions } from "@/features/planner/use-planner-persistence-actions";

const postJsonMock = vi.hoisted(() => vi.fn());
const toastWarningMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return {
    ...actual,
    postJson: (...args: unknown[]) => postJsonMock(...args),
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: toastWarningMock,
  },
}));

describe("usePlannerPersistenceActions", () => {
  beforeEach(() => {
    postJsonMock.mockReset();
    toastWarningMock.mockReset();
  });

  afterEach(() => cleanup());

  it("commits the returned digest and clears the draft even when calendar reload fails", async () => {
    const calls: string[] = [];
    postJsonMock.mockResolvedValue({
      replayed: false,
      scheduleDigest: "b".repeat(64),
    });
    const clearDraftSession = vi.fn(() => calls.push("clear"));
    const onScheduleDigestChange = vi.fn(() => calls.push("digest"));
    const handlePlannerMutation = vi.fn(() => calls.push("invalidate"));
    const loadContext = vi.fn(async () => {
      calls.push("reload");
      return false;
    });
    const resetForPlannerStateReset = vi.fn(() => calls.push("coach"));
    const context = buildPlannerContext({
      overrides: {
        revisions: {
          canonicalRevision: 1,
          executionRevision: 1,
          scheduleDigest: "a".repeat(64),
        },
      },
    });
    const draftSaveWindow = { start: "2026-08-01", end: "2026-08-31" };
    const { result } = renderHook(() =>
      usePlannerPersistenceActions({
        context,
        month: "2026-08",
        hasDraftSession: true,
        draftSaveWindow,
        draftSaveWindowResult: { ok: true, window: draftSaveWindow },
        draftSaveCommands: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            sequence: 0,
            kind: "move_item",
            goalId: "22222222-2222-4222-8222-222222222222",
            unitKey: "unit-1",
            sourceDate: "2026-08-20",
            scheduledDate: "2026-08-10",
          },
        ],
        effectiveDraftPolicy: null,
        draftPreview: context.preview,
        draftPreviewWindow: draftSaveWindow,
        clearDraftSession,
        onScheduleDigestChange,
        handlePlannerMutation,
        loadContext,
        cacheDraftPreviewForWindow: vi.fn(),
        requestPreviewForWindow: vi.fn(),
        coachActions: {
          resetForPlannerStateReset,
          onDraftDiscarded: vi.fn(),
        },
      })
    );

    await act(async () => result.current.savePlan());

    expect(onScheduleDigestChange).toHaveBeenCalledWith("b".repeat(64), null);
    expect(clearDraftSession).toHaveBeenCalledTimes(1);
    expect(loadContext).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["digest", "clear", "coach", "invalidate", "reload"]);
    expect(toastWarningMock).toHaveBeenCalledWith(
      "Plan saved. Calendar reload is temporarily unavailable, but the draft is no longer pending."
    );
  });
});
