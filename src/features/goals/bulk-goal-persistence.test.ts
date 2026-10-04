import { describe, expect, it, vi } from "vitest";
import {
  type BulkGoalDraft,
  buildBulkGoalDraftsFromLlmGoals,
  type PreparedBulkGoalRow,
  withValidatedBulkGoalDraft,
} from "@/lib/goals/bulk-drafts";
import {
  persistBulkGoalDrafts,
  retryBulkGoalCreation,
  retryBulkGoalLinks,
} from "@/features/goals/bulk-goal-persistence";

function makeDraft(
  overrides: Partial<Omit<BulkGoalDraft, "errors">> = {}
): BulkGoalDraft {
  const [draft] = buildBulkGoalDraftsFromLlmGoals([
    {
      title: "Easy run",
      category: "Health",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      start_date: "2026-08-17",
      end_date: "2026-09-13",
    },
  ]);
  if (!draft) {
    throw new Error("Failed to build draft fixture.");
  }
  return withValidatedBulkGoalDraft({
    ...draft,
    ...overrides,
  });
}

describe("persistBulkGoalDrafts", () => {
  it("creates exact create_goals and create_goal_links contracts for mixed draft shapes", async () => {
    const periodDraft = makeDraft({
      title: "Daily reset",
      recurrence_interval: "daily",
      target_basis: "period",
      target_count: "",
      difficulty: "hard",
      is_private: true,
      linked_target_goal_id: "goal-main-a",
    });
    const lifetimeDraft = makeDraft({
      title: "Lifetime miles",
      recurrence_interval: "weekly",
      target_basis: "lifetime",
      target_count: "12",
      linked_target_goal_id: "none",
    });
    const milestoneDraft = makeDraft({
      title: "Launch checklist",
      frequency_type: "fixed_milestones",
      target_basis: "lifetime",
      target_count: "2",
      milestone_names: ["Spec approved", ""],
      linked_target_goal_id: "goal-main-c",
    });

    const rpcMock = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });
    const idSequence = [
      "10000000-0000-4000-8000-000000000001",
      "10000000-0000-4000-8000-000000000002",
      "10000000-0000-4000-8000-000000000003",
    ];

    const result = await persistBulkGoalDrafts({
      drafts: [periodDraft, lifetimeDraft, milestoneDraft],
      currentUserId: "user-1",
      supabase: { rpc: rpcMock },
      createId: () => idSequence.shift() ?? crypto.randomUUID(),
    });

    expect(result).toMatchObject({
      status: "created",
      createdCount: 3,
      linkErrorMessage: null,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(1, "create_goals", {
      p_goals: [
        expect.objectContaining({
          id: "10000000-0000-4000-8000-000000000001",
          title: "Daily reset",
          frequency_type: "recurring",
          recurrence_interval: "daily",
          target_basis: "period",
          target_count: 1,
          milestone_names: null,
          difficulty: "hard",
          is_private: true,
        }),
        expect.objectContaining({
          id: "10000000-0000-4000-8000-000000000002",
          title: "Lifetime miles",
          frequency_type: "recurring",
          recurrence_interval: "weekly",
          target_basis: "lifetime",
          target_count: 12,
          milestone_names: null,
        }),
        expect.objectContaining({
          id: "10000000-0000-4000-8000-000000000003",
          title: "Launch checklist",
          frequency_type: "fixed_milestones",
          recurrence_interval: null,
          target_basis: "lifetime",
          target_count: 2,
          milestone_names: ["Spec approved", "Milestone 2"],
        }),
      ],
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "create_goal_links", {
      p_links: [
        {
          source_goal_id: "10000000-0000-4000-8000-000000000001",
          target_goal_id: "goal-main-a",
        },
        {
          source_goal_id: "10000000-0000-4000-8000-000000000003",
          target_goal_id: "goal-main-c",
        },
      ],
    });
  });

  it("does not call create_goal_links when drafts are not linked", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ error: null });

    const result = await persistBulkGoalDrafts({
      drafts: [makeDraft({ linked_target_goal_id: "none" })],
      currentUserId: "user-1",
      supabase: { rpc: rpcMock },
      createId: () => "10000000-0000-4000-8000-000000000011",
    });

    expect(result).toMatchObject({
      status: "created",
      createdCount: 1,
      linkErrorMessage: null,
    });
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith("create_goals", {
      p_goals: [
        expect.objectContaining({
          id: "10000000-0000-4000-8000-000000000011",
        }),
      ],
    });
  });

  it("rejects when no drafts are selected", async () => {
    await expect(
      persistBulkGoalDrafts({
        drafts: [],
        currentUserId: "user-1",
        supabase: { rpc: vi.fn() },
      })
    ).rejects.toMatchObject({
      code: "no_selected_goals",
      message: "Select at least one draft to create.",
    });
  });

  it("rejects invalid drafts before rpc calls", async () => {
    const invalidDraft = makeDraft({ title: "" });
    const rpcMock = vi.fn();

    await expect(
      persistBulkGoalDrafts({
        drafts: [invalidDraft],
        currentUserId: "user-1",
        supabase: { rpc: rpcMock },
      })
    ).rejects.toMatchObject({
      code: "invalid_goals",
      message: "Fix validation issues in selected drafts before creating.",
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("returns a typed recovery payload for rejected create_goals calls", async () => {
    const draft = makeDraft();

    await expect(
      persistBulkGoalDrafts({
        drafts: [draft],
        currentUserId: "user-1",
        supabase: {
          rpc: vi.fn().mockRejectedValue(new Error("network timeout")),
        },
      })
    ).rejects.toMatchObject({
      code: "create_ambiguous",
      message: "network timeout",
      preparedRows: [{ goalId: draft.id }],
    });
  });

  it("keeps returned create_goals errors definitive and editable", async () => {
    const draft = makeDraft();

    await expect(
      persistBulkGoalDrafts({
        drafts: [draft],
        currentUserId: "user-1",
        supabase: {
          rpc: vi.fn().mockResolvedValue({
            error: { message: "create_goals exploded" },
          }),
        },
      })
    ).rejects.toMatchObject({
      code: "create_failed",
      message: "create_goals exploded",
    });
  });

  it("keeps returned link errors retryable with prepared recovery rows", async () => {
    const rpcMock = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "link save failed" } });

    await expect(
      persistBulkGoalDrafts({
        drafts: [makeDraft({ linked_target_goal_id: "goal-main-a" })],
        currentUserId: "user-1",
        supabase: { rpc: rpcMock },
        createId: () => "10000000-0000-4000-8000-000000000021",
      })
    ).rejects.toMatchObject({
      code: "links_failed",
      message: "Some linked goals were not saved: link save failed",
      linkRecovery: {
        preparedRows: [{ goalId: "10000000-0000-4000-8000-000000000021" }],
      },
    });
  });

  it("uses a stable fallback for returned link errors without messages", async () => {
    const rpcMock = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: {} });

    await expect(
      persistBulkGoalDrafts({
        drafts: [makeDraft({ linked_target_goal_id: "goal-main-a" })],
        currentUserId: "user-1",
        supabase: { rpc: rpcMock },
      })
    ).rejects.toMatchObject({
      code: "links_failed",
      message:
        "Some linked goals were not saved: Could not save goal links. Try again.",
      linkRecovery: {
        preparedRows: expect.any(Array),
      },
    });
  });

  it("recovers rejected link calls without rerunning goal creation", async () => {
    const rpcMock = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockRejectedValueOnce(new Error("link request timed out"));
    const draft = makeDraft({ linked_target_goal_id: "goal-main-a" });

    const result = await persistBulkGoalDrafts({
      drafts: [draft],
      currentUserId: "user-1",
      supabase: { rpc: rpcMock },
    });

    expect(result).toMatchObject({
      status: "partial_success",
      linkErrorMessage: "Some linked goals were not saved: link request timed out",
      linkRecovery: {
        preparedRows: [{ goalId: draft.id }],
      },
    });
    expect(rpcMock).toHaveBeenCalledTimes(2);
  });

  it("notifies the caller immediately after create_goals succeeds", async () => {
    const onGoalsPersisted = vi.fn();
    const rpcMock = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "link save failed" } });

    await expect(
      persistBulkGoalDrafts({
        drafts: [makeDraft({ linked_target_goal_id: "goal-main-a" })],
        currentUserId: "user-1",
        supabase: { rpc: rpcMock },
        onGoalsPersisted,
      })
    ).rejects.toMatchObject({
      code: "links_failed",
      message: "Some linked goals were not saved: link save failed",
    });

    expect(onGoalsPersisted).toHaveBeenCalledTimes(1);
    expect(onGoalsPersisted.mock.invocationCallOrder[0]).toBeLessThan(
      rpcMock.mock.invocationCallOrder[1]!
    );
  });

  it("notifies the caller again only after linked goals finish persisting", async () => {
    const onGoalsPersisted = vi.fn();
    const onLinksPersisted = vi.fn();
    const rpcMock = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    await persistBulkGoalDrafts({
      drafts: [makeDraft({ linked_target_goal_id: "goal-main-a" })],
      currentUserId: "user-1",
      supabase: { rpc: rpcMock },
      onGoalsPersisted,
      onLinksPersisted,
    });

    expect(onGoalsPersisted).toHaveBeenCalledTimes(1);
    expect(onLinksPersisted).toHaveBeenCalledTimes(1);
    expect(onGoalsPersisted.mock.invocationCallOrder[0]).toBeLessThan(
      rpcMock.mock.invocationCallOrder[1]!
    );
    expect(onLinksPersisted.mock.invocationCallOrder[0]).toBeGreaterThan(
      rpcMock.mock.invocationCallOrder[1]!
    );
  });

  it("retries goal creation with the exact prepared rows after an ambiguous create", async () => {
    const draft = makeDraft({ linked_target_goal_id: "goal-main-a" });
    let preparedRows: PreparedBulkGoalRow[] | undefined;

    try {
      await persistBulkGoalDrafts({
        drafts: [draft],
        currentUserId: "user-1",
        supabase: {
          rpc: vi.fn().mockRejectedValue(new Error("create timed out")),
        },
      });
    } catch (error) {
      preparedRows = (
        error as { preparedRows?: PreparedBulkGoalRow[] }
      ).preparedRows;
    }

    expect(preparedRows).toBeDefined();
    const rpcMock = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    await retryBulkGoalCreation({
      preparedRows: preparedRows!,
      supabase: { rpc: rpcMock },
    });

    expect(rpcMock).toHaveBeenNthCalledWith(1, "create_goals", {
      p_goals: [preparedRows![0]!.row],
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "create_goal_links", {
      p_links: [
        {
          source_goal_id: preparedRows![0]!.goalId,
          target_goal_id: "goal-main-a",
        },
      ],
    });
  });

  it("retries only failed link rows without creating duplicate goals", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ error: null });
    const linkRows = [
      {
        source_goal_id: "10000000-0000-4000-8000-000000000031",
        target_goal_id: "goal-main-a",
      },
    ];

    await expect(
      retryBulkGoalLinks({
        linkRows,
        supabase: { rpc: rpcMock },
      })
    ).resolves.toEqual({ status: "created" });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith("create_goal_links", {
      p_links: linkRows,
    });
  });

  it("keeps link retry failures typed when the rpc promise rejects", async () => {
    await expect(
      retryBulkGoalLinks({
        linkRows: [
          {
            source_goal_id: "10000000-0000-4000-8000-000000000031",
            target_goal_id: "goal-main-a",
          },
        ],
        supabase: {
          rpc: vi.fn().mockRejectedValue(new Error("retry timed out")),
        },
      })
    ).rejects.toMatchObject({
      code: "links_ambiguous",
      message: "Some linked goals were not saved: retry timed out",
    });
  });

  it("uses the stable fallback for link retry errors without messages", async () => {
    await expect(
      retryBulkGoalLinks({
        linkRows: [
          {
            source_goal_id: "10000000-0000-4000-8000-000000000031",
            target_goal_id: "goal-main-a",
          },
        ],
        supabase: {
          rpc: vi.fn().mockResolvedValue({ error: {} }),
        },
      })
    ).rejects.toMatchObject({
      code: "links_failed",
      message:
        "Some linked goals were not saved: Could not save goal links. Try again.",
    });
  });
});
