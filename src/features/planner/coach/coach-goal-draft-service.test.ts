import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildBulkGoalDraftsFromLlmGoals } from "@/features/goals/bulk-goal-drafts";
import {
  createCoachGoalDrafts,
  parseCoachGoalDrafts,
} from "@/features/planner/coach/coach-goal-draft-service";

const postJsonMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const authGetUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/client")>(
    "@/lib/api/client"
  );
  return { ...actual, postJson: postJsonMock };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: authGetUserMock },
    rpc: rpcMock,
  }),
}));

describe("coach goal draft service", () => {
  beforeEach(() => {
    postJsonMock.mockReset();
    rpcMock.mockReset();
    authGetUserMock.mockReset();
    authGetUserMock.mockResolvedValue({
      data: { user: { id: "coach-user-1" } },
    });
  });

  it("uses the confirmed planner timezone when parsing", async () => {
    postJsonMock.mockResolvedValue({
      goals: [
        {
          title: "Easy run",
          frequency_type: "recurring",
          recurrence_interval: "weekly",
          start_date: "2026-08-17",
        },
      ],
      warnings: [],
    });

    const result = await parseCoachGoalDrafts({
      parserPrompt: "Easy run weekly.",
      timezone: "America/Los_Angeles",
    });

    expect(postJsonMock).toHaveBeenCalledWith("/api/bulk-goals/parse", {
      prompt: "Easy run weekly.",
      timezone: "America/Los_Angeles",
    }, {
      timeoutMs: 45_000,
    });
    expect(result.drafts[0]?.title).toBe("Easy run");
  });

  it("rejects parser responses over the five-goal coach cap", async () => {
    postJsonMock.mockResolvedValue({
      goals: Array.from({ length: 6 }, (_, index) => ({
        title: `Goal ${index + 1}`,
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        start_date: "2026-08-17",
      })),
    });

    await expect(
      parseCoachGoalDrafts({
        parserPrompt: "Build a plan.",
        timezone: "UTC",
      })
    ).rejects.toMatchObject({ code: "too_many_goals" });
  });

  it("persists selected validated drafts through shared goal and link contracts", async () => {
    const drafts = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Easy run",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        start_date: "2026-08-17",
      },
      {
        title: "Mobility",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        start_date: "2026-08-17",
        target_count: 2,
      },
    ]);
    drafts[1] = { ...drafts[1]!, include: false };
    drafts[0] = {
      ...drafts[0]!,
      linked_target_goal_id: "goal-main-1",
    };
    rpcMock
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    await expect(createCoachGoalDrafts({ drafts })).resolves.toEqual({
      createdCount: 1,
      linkErrorMessage: null,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(1, "create_goals", {
      p_goals: [
        expect.objectContaining({
          title: "Easy run",
          recurrence_interval: "weekly",
        }),
      ],
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "create_goal_links", {
      p_links: [
        expect.objectContaining({
          target_goal_id: "goal-main-1",
        }),
      ],
    });
  });
});
