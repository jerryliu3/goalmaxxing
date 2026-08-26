import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildBulkGoalDraftsFromLlmGoals } from "@/features/goals/bulk-goal-drafts";
import {
  createCoachGoalDrafts,
  parseCoachGoalDrafts,
  retryCoachGoalDraftLinks,
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
      difficulty: "hard",
      is_private: true,
      linked_target_goal_id: "goal-main-1",
    };
    rpcMock
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    await expect(createCoachGoalDrafts({ drafts })).resolves.toEqual({
      status: "created",
      createdCount: 1,
      linkErrorMessage: null,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(1, "create_goals", {
      p_goals: [
        {
          id: expect.any(String),
          title: "Easy run",
          description: null,
          category_key: "personal",
          category: "Personal",
          color: "#6366f1",
          frequency_type: "recurring",
          recurrence_interval: "weekly",
          target_count: 1,
          target_basis: "period",
          milestone_names: null,
          start_date: "2026-08-17",
          end_date: null,
          default_local_time: null,
          difficulty: "hard",
          is_private: true,
        },
      ],
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "create_goal_links", {
      p_links: [
        {
          source_goal_id: expect.any(String),
          target_goal_id: "goal-main-1",
        },
      ],
    });
  });

  it("surfaces definitive link failures with retryable link recovery", async () => {
    const drafts = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Mobility",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        start_date: "2026-08-17",
      },
    ]);
    drafts[0] = {
      ...drafts[0]!,
      linked_target_goal_id: "goal-main-1",
    };
    rpcMock
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "link save failed" } });

    await expect(createCoachGoalDrafts({ drafts })).rejects.toMatchObject({
      code: "links_failed",
      message: "Some linked goals were not saved: link save failed",
      linkRecovery: {
        preparedRows: [{ goalId: drafts[0]!.id }],
        linkRows: [
          {
            target_goal_id: "goal-main-1",
          },
        ],
      },
    });
  });

  it("keeps returned create errors definitive without a recovery payload", async () => {
    const drafts = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Mobility",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        start_date: "2026-08-17",
      },
    ]);
    rpcMock.mockResolvedValue({ error: { message: "invalid goal payload" } });

    await expect(createCoachGoalDrafts({ drafts })).rejects.toMatchObject({
      code: "create_failed",
      message: "invalid goal payload",
    });
  });

  it("preserves deterministic create recovery when the rpc promise rejects", async () => {
    const [draft] = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Mobility",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        start_date: "2026-08-17",
      },
    ]);
    rpcMock.mockRejectedValue(new Error("create request timed out"));

    await expect(createCoachGoalDrafts({ drafts: [draft!] })).rejects.toMatchObject({
      code: "create_ambiguous",
      message: "create request timed out",
      preparedRows: [{ goalId: draft!.id }],
    });
  });

  it("uses the stable fallback for coach link errors without messages", async () => {
    rpcMock.mockResolvedValue({ error: {} });

    await expect(
      retryCoachGoalDraftLinks({
        linkRows: [
          {
            source_goal_id: "goal-created-1",
            target_goal_id: "goal-main-1",
          },
        ],
      })
    ).rejects.toMatchObject({
      code: "links_failed",
      message:
        "Some linked goals were not saved: Could not save goal links. Try again.",
    });
  });
});
