import { describe, expect, it, vi } from "vitest";
import {
  type BulkGoalDraft,
  buildBulkGoalDraftsFromLlmGoals,
  withValidatedBulkGoalDraft,
} from "@/features/goals/bulk-goal-drafts";
import {
  persistBulkGoalDrafts,
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

  it("returns actionable create_goals rpc failures", async () => {
    await expect(
      persistBulkGoalDrafts({
        drafts: [makeDraft()],
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

  it("returns explicit link persistence warnings without dropping created counts", async () => {
    const rpcMock = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "link save failed" } });

    const result = await persistBulkGoalDrafts({
      drafts: [makeDraft({ linked_target_goal_id: "goal-main-a" })],
      currentUserId: "user-1",
      supabase: { rpc: rpcMock },
      createId: () => "10000000-0000-4000-8000-000000000021",
    });

    expect(result).toMatchObject({
      status: "partial_success",
      createdCount: 1,
      linkErrorMessage: "Some linked goals were not saved: link save failed",
      linkRecovery: {
        linkRows: [
          {
            target_goal_id: "goal-main-a",
          },
        ],
      },
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
});
