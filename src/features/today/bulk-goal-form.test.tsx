import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BulkGoalForm } from "@/features/today/bulk-goal-form";
import type { Goal } from "@/lib/goals/types";

const postJsonMock = vi.hoisted(() => vi.fn());
const authGetUserMock = vi.hoisted(() => vi.fn());
const goalsOrderMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const uploadMock = vi.hoisted(() => vi.fn());
const routerReplaceMock = vi.hoisted(() => vi.fn());
const routerRefreshMock = vi.hoisted(() => vi.fn());
const invalidatePlannerRelatedTabCachesMock = vi.hoisted(() => vi.fn());
const fetchProgressContextMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
const toastWarningMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/lib/navigation/use-app-router", () => ({
  useAppRouter: () => ({
    push: vi.fn(),
    replace: routerReplaceMock,
    prefetch: vi.fn(),
    refresh: routerRefreshMock,
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

vi.mock("@/lib/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/client")>(
    "@/lib/api/client"
  );
  return {
    ...actual,
    postJson: postJsonMock,
  };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: authGetUserMock,
    },
    from: (table: string) => {
      if (table !== "goals") {
        throw new Error(`Unexpected table in bulk-goal-form test: ${table}`);
      }
      const query = {
        eq: vi.fn().mockReturnThis(),
        order: goalsOrderMock,
      };
      return {
        select: vi.fn(() => query),
      };
    },
    rpc: rpcMock,
    storage: {
      from: () => ({
        upload: uploadMock,
      }),
    },
  }),
}));

vi.mock("@/lib/goals/progress-context", async () => {
  const actual = await vi.importActual<typeof import("@/lib/goals/progress-context")>(
    "@/lib/goals/progress-context"
  );
  return {
    ...actual,
    fetchProgressContext: fetchProgressContextMock,
  };
});

vi.mock("@/lib/cache/planner-tab-cache", () => ({
  invalidatePlannerRelatedTabCaches: invalidatePlannerRelatedTabCachesMock,
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
    warning: toastWarningMock,
  },
}));

vi.mock("@/features/goals/goal-link-target-select", () => ({
  GoalLinkTargetSelect: ({
    value,
    onValueChange,
    filteredLinkTargets,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    filteredLinkTargets: Array<{ id: string }>;
  }) => (
    <button
      type="button"
      aria-label="Select link target"
      onClick={() => onValueChange(filteredLinkTargets[0]?.id ?? "none")}
    >
      {value}
    </button>
  ),
}));

const activeLinkTarget: Goal = {
  id: "goal-main-1",
  owner_id: "user-1",
  title: "Main goal",
  description: null,
  category: "Health",
  category_key: "health",
  color: "#16a34a",
  frequency_type: "recurring",
  recurrence_interval: "weekly",
  target_count: 2,
  target_basis: "period",
  milestone_names: null,
  start_date: "2026-08-01",
  end_date: "2026-12-31",
  reward_text: null,
  default_local_time: null,
  photo_path: null,
  team_id: null,
  is_deleted: false,
  archived_at: null,
  is_private: false,
  difficulty: "medium",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

function parseNaturalLanguageGoals(
  goals: Array<Record<string, unknown>>,
  user: ReturnType<typeof userEvent.setup>
) {
  postJsonMock.mockResolvedValue({ goals, warnings: [] });
  const prompt =
    "Create one weekly strength goal and one lifetime presentation practice goal.";
  return user
    .type(screen.getByLabelText("Describe goals in natural language"), prompt)
    .then(() =>
      user.click(screen.getByRole("button", { name: "Parse natural language" }))
    )
    .then(() =>
      waitFor(() => {
        expect(postJsonMock).toHaveBeenCalledWith(
          "/api/bulk-goals/parse",
          {
            prompt,
            timezone: expect.any(String),
          },
          {
            timeoutMs: 45_000,
          }
        );
      })
    );
}

function firstTapToEditButton() {
  return screen.getAllByRole("button", { name: /tap to edit/i })[0]!;
}

describe("BulkGoalForm", () => {
  beforeEach(() => {
    authGetUserMock.mockReset().mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    goalsOrderMock.mockReset().mockResolvedValue({
      data: [activeLinkTarget],
      error: null,
    });
    rpcMock.mockReset();
    uploadMock.mockReset();
    routerReplaceMock.mockReset();
    routerRefreshMock.mockReset();
    invalidatePlannerRelatedTabCachesMock.mockReset();
    fetchProgressContextMock.mockReset().mockResolvedValue({
      summaries: [{ goalId: "goal-main-1", lifecycle: "active" }],
      facts: [],
      truncated: false,
    });
    postJsonMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    toastWarningMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("parses drafts into the shared editor and persists exact goal/link payloads", async () => {
    const randomUuidSpy = vi.spyOn(globalThis.crypto, "randomUUID");
    try {
      randomUuidSpy
        .mockReturnValueOnce("draft-1")
        .mockReturnValueOnce("draft-2")
        .mockReturnValueOnce("goal-1")
        .mockReturnValueOnce("goal-2");
      rpcMock.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({
        error: null,
      });

      const user = userEvent.setup();
      render(<BulkGoalForm showBackButton={false} />);
      await screen.findByText("Create multiple goals");

      await parseNaturalLanguageGoals(
        [
          {
            title: "Strength sessions",
            description: "Base work",
            category: "Health",
            frequency_type: "recurring",
            recurrence_interval: "weekly",
            target_basis: "period",
            target_count: 2,
            start_date: "2026-08-17",
            end_date: "2026-09-28",
          },
          {
            title: "Practice talks",
            category: "Personal",
            frequency_type: "recurring",
            recurrence_interval: "weekly",
            target_basis: "lifetime",
            target_count: 12,
            start_date: "2026-08-17",
            end_date: "2026-10-15",
          },
        ],
        user
      );

      expect(screen.getByText("Strength sessions")).toBeInTheDocument();
      expect(screen.getByText("Practice talks")).toBeInTheDocument();

      await user.click(firstTapToEditButton());
      const dialog = await screen.findByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", { name: /advanced settings/i })
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Select link target" })
      );
      await user.click(screen.getByRole("button", { name: "Close" }));

      await user.click(
        screen.getByRole("button", { name: "Create selected goals" })
      );

      await waitFor(() => {
        expect(rpcMock).toHaveBeenCalledTimes(2);
      });
      expect(rpcMock).toHaveBeenNthCalledWith(1, "create_goals", {
        p_goals: [
          {
            id: "goal-1",
            title: "Strength sessions",
            description: "Base work",
            category_key: "health",
            category: "Health",
            color: "#10b981",
            frequency_type: "recurring",
            recurrence_interval: "weekly",
            target_count: 2,
            target_basis: "period",
            milestone_names: null,
            start_date: "2026-08-17",
            end_date: "2026-09-28",
            default_local_time: null,
          },
          {
            id: "goal-2",
            title: "Practice talks",
            description: null,
            category_key: "personal",
            category: "Personal",
            color: "#6366f1",
            frequency_type: "recurring",
            recurrence_interval: "weekly",
            target_count: 12,
            target_basis: "lifetime",
            milestone_names: null,
            start_date: "2026-08-17",
            end_date: "2026-10-15",
            default_local_time: null,
          },
        ],
      });
      expect(rpcMock).toHaveBeenNthCalledWith(2, "create_goal_links", {
        p_links: [
          {
            source_goal_id: "goal-1",
            target_goal_id: "goal-main-1",
          },
        ],
      });
      expect(invalidatePlannerRelatedTabCachesMock).toHaveBeenCalledTimes(1);
      expect(routerReplaceMock).toHaveBeenCalledWith("/");
      expect(routerRefreshMock).toHaveBeenCalledTimes(1);
    } finally {
      randomUuidSpy.mockRestore();
    }
  });

  it("keeps parsed drafts intact when create_goals fails", async () => {
    rpcMock.mockResolvedValueOnce({
      error: { message: "create_goals exploded" },
    });
    const user = userEvent.setup();
    render(<BulkGoalForm showBackButton={false} />);
    await screen.findByText("Create multiple goals");

    await parseNaturalLanguageGoals(
      [
        {
          title: "Mobility",
          frequency_type: "recurring",
          recurrence_interval: "weekly",
          target_basis: "period",
          target_count: 2,
          start_date: "2026-08-17",
        },
      ],
      user
    );

    await user.click(
      screen.getByRole("button", { name: "Create selected goals" })
    );

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("create_goals exploded");
    });
    expect(screen.getByText("Mobility")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create selected goals" })
    ).toBeEnabled();
    expect(invalidatePlannerRelatedTabCachesMock).not.toHaveBeenCalled();
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });

  it("blocks creation while selected drafts remain invalid", async () => {
    const user = userEvent.setup();
    render(<BulkGoalForm showBackButton={false} />);
    await screen.findByText("Create multiple goals");

    await parseNaturalLanguageGoals(
      [
        {
          title: "Valid goal",
          frequency_type: "recurring",
          recurrence_interval: "weekly",
          target_basis: "period",
          target_count: 2,
          start_date: "2026-08-17",
        },
        {
          title: "",
          frequency_type: "recurring",
          recurrence_interval: "weekly",
          target_basis: "period",
          target_count: 2,
          start_date: "2026-08-17",
        },
      ],
      user
    );

    expect(screen.getByText("1 selected with errors")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create selected goals" })
    ).toBeDisabled();
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
