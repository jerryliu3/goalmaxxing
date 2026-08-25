import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoalCreationFieldControls } from "@/features/goals/goal-creation-fields";
import { createDefaultGoalCreationFields } from "@/features/goals/goal-creation-model";
import {
  GoalForm,
  getGoalFormTargetValidationError,
} from "@/features/today/goal-form";
import { resolveGoalDefinitionValidationFeedback } from "@/features/today/goal-form-validation";
import { validateGoalDefinition } from "@/lib/goals/definition-validation";
import type { Goal } from "@/lib/goals/types";

const authGetUserMock = vi.hoisted(() => vi.fn());
const goalsOrderMock = vi.hoisted(() => vi.fn());
const profileMaybeSingleMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const routerReplaceMock = vi.hoisted(() => vi.fn());
const routerRefreshMock = vi.hoisted(() => vi.fn());
const appRouterMock = vi.hoisted(() => ({
  replace: routerReplaceMock,
  refresh: routerRefreshMock,
  push: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}));
const invalidatePlannerRelatedTabCachesMock = vi.hoisted(() => vi.fn());
const fetchProgressContextMock = vi.hoisted(() => vi.fn());
const requestXpRefreshMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/navigation/use-app-router", () => ({
  useAppRouter: () => appRouterMock,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: authGetUserMock },
    from: (table: string) => {
      if (table === "profiles") {
        const query = {
          eq: vi.fn().mockReturnThis(),
          maybeSingle: profileMaybeSingleMock,
        };
        return { select: vi.fn(() => query) };
      }
      const query = {
        eq: vi.fn().mockReturnThis(),
        order: goalsOrderMock,
      };
      return { select: vi.fn(() => query) };
    },
    rpc: rpcMock,
    storage: {
      from: () => ({
        createSignedUrl: vi.fn().mockResolvedValue({ data: null }),
        upload: vi.fn(),
      }),
    },
  }),
}));

vi.mock("@/lib/goals/progress-context", async () => {
  const actual = await vi.importActual<typeof import("@/lib/goals/progress-context")>(
    "@/lib/goals/progress-context"
  );
  return { ...actual, fetchProgressContext: fetchProgressContextMock };
});

vi.mock("@/lib/cache/planner-tab-cache", () => ({
  invalidatePlannerRelatedTabCaches: invalidatePlannerRelatedTabCachesMock,
}));

vi.mock("@/lib/xp/events", () => ({
  requestXpRefresh: requestXpRefreshMock,
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
    warning: vi.fn(),
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

beforeEach(() => {
  authGetUserMock.mockReset().mockResolvedValue({
    data: { user: { id: "user-1" } },
  });
  goalsOrderMock.mockReset().mockResolvedValue({
    data: [activeLinkTarget],
    error: null,
  });
  profileMaybeSingleMock.mockReset().mockResolvedValue({
    data: { rest_weekdays: [], blackout_ranges: [] },
    error: null,
  });
  fetchProgressContextMock.mockReset().mockResolvedValue({
    summaries: [{ goalId: "goal-main-1", lifecycle: "active" }],
    facts: [],
    truncated: false,
  });
  rpcMock.mockReset();
  routerReplaceMock.mockReset();
  routerRefreshMock.mockReset();
  invalidatePlannerRelatedTabCachesMock.mockReset();
  requestXpRefreshMock.mockReset();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
});

describe("goal form definition validation adapter", () => {
  afterEach(() => {
    cleanup();
  });

  it("blocks period-limit errors for daily, weekly, and monthly period goals", () => {
    const cases = [
      {
        recurrenceInterval: "daily" as const,
        targetCount: 2,
        message: "Target cannot exceed 1 completions for this period length.",
      },
      {
        recurrenceInterval: "weekly" as const,
        targetCount: 8,
        message: "Target cannot exceed 7 completions for this period length.",
      },
      {
        recurrenceInterval: "monthly" as const,
        targetCount: 32,
        message: "Target cannot exceed 31 completions for this period length.",
      },
    ];

    for (const testCase of cases) {
      const issues = validateGoalDefinition({
        frequencyType: "recurring",
        targetBasis: "period",
        recurrenceInterval: testCase.recurrenceInterval,
        targetCount: testCase.targetCount,
        startDate: "2026-08-01",
        endDate: null,
      });
      const feedback = resolveGoalDefinitionValidationFeedback(issues);

      expect(feedback.validationError, testCase.recurrenceInterval).toBe(
        testCase.message
      );
      expect(feedback.validationWarning, testCase.recurrenceInterval).toBeNull();
    }
  });

  it("allows profile-capacity warnings without blocking submission", () => {
    const issues = validateGoalDefinition({
      frequencyType: "fixed_milestones",
      targetCount: 6,
      startDate: "2026-08-01",
      endDate: "2026-08-07",
      asOfDate: "2026-08-01",
      capacity: {
        restWeekdays: [0, 6],
        blackoutRanges: [],
      },
    });
    const feedback = resolveGoalDefinitionValidationFeedback(issues);

    expect(feedback.validationError).toBeNull();
    expect(feedback.validationWarning).toContain("Only 5 available days");
  });

  it("keeps persisted single-goal definition fields disabled in edit mode", () => {
    const fields = {
      ...createDefaultGoalCreationFields(),
      title: "Existing goal",
      frequency_type: "recurring" as const,
      recurrence_interval: "weekly" as const,
      target_basis: "period" as const,
      target_count: "3",
      start_date: "2026-08-01",
      end_date: "2026-12-31",
    };

    render(
      <GoalCreationFieldControls
        fields={fields}
        onFieldChange={vi.fn()}
        onPatch={vi.fn()}
        definitionFieldsLocked
        createKind="recurring"
        onCreateKindChange={vi.fn()}
        isEditing
        isPlannerTask={false}
        linkTarget={{
          value: "none",
          onValueChange: vi.fn(),
          open: false,
          onOpenChange: vi.fn(),
          searchQuery: "",
          onSearchQueryChange: vi.fn(),
          filteredLinkTargets: [],
          selectedTargetGoal: null,
        }}
      />
    );

    expect(
      screen.getByText(
        "Goal type, frequency, target, and start date are fixed after creation. Archive this goal and create a new one to change them."
      )
    ).toBeInTheDocument();

    const comboboxes = screen.getAllByRole("combobox");
    const goalTypeCombobox = comboboxes.find((element) =>
      element.textContent?.includes("Recurring")
    );
    const frequencyCombobox = comboboxes.find((element) =>
      element.textContent?.includes("Weekly")
    );
    const targetField = document.querySelector<HTMLInputElement>(
      "#recurring-target-count"
    );

    expect(goalTypeCombobox).toBeDefined();
    expect(goalTypeCombobox).toBeDisabled();
    expect(frequencyCombobox).toBeDefined();
    expect(frequencyCombobox).toBeDisabled();
    expect(targetField).toBeTruthy();
    expect(targetField).toBeDisabled();
    expect(screen.getByLabelText("Start date")).toBeDisabled();
    expect(screen.getByLabelText("End date (optional)")).not.toBeDisabled();
  });
});

describe("GoalForm target validation", () => {
  it("uses strict target parsing instead of truncating fractional input", () => {
    expect(
      getGoalFormTargetValidationError({
        ...createDefaultGoalCreationFields(),
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_basis: "period",
        target_count: "1.5",
      })
    ).toBe("Per-period target must be a positive whole number.");
  });

  it("blocks an empty lifetime recurring target", () => {
    expect(
      getGoalFormTargetValidationError({
        ...createDefaultGoalCreationFields(),
        frequency_type: "recurring",
        recurrence_interval: "daily",
        target_basis: "lifetime",
        target_count: "",
      })
    ).toBe("Total target completions requires a positive target.");
  });
});

describe("GoalForm persistence recovery", () => {
  afterEach(() => {
    cleanup();
  });

  it("retains a saved goal and retries a rejected link without reporting success", async () => {
    const randomUuidSpy = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("99000000-0000-4000-8000-000000000001");
    const onExit = vi.fn();
    rpcMock
      .mockResolvedValueOnce({ error: null })
      .mockRejectedValueOnce(new Error("link request timed out"))
      .mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();

    try {
      render(<GoalForm showBackButton={false} onExit={onExit} />);
      await screen.findByText("New goal");
      await user.type(screen.getByLabelText("Name"), "Daily reset");
      await user.click(
        screen.getByRole("button", { name: /advanced settings/i })
      );
      await user.click(screen.getByRole("button", { name: "Select link target" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Retry saving link" })).toBeInTheDocument();
      });
      expect(toastSuccessMock).not.toHaveBeenCalled();
      expect(onExit).not.toHaveBeenCalled();
      expect(invalidatePlannerRelatedTabCachesMock).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "Retry saving link" }));

      await waitFor(() => {
        expect(onExit).toHaveBeenCalledTimes(1);
      });
      expect(rpcMock).toHaveBeenNthCalledWith(
        1,
        "create_goal",
        expect.objectContaining({
          p_id: "99000000-0000-4000-8000-000000000001",
        })
      );
      expect(rpcMock).toHaveBeenNthCalledWith(2, "replace_goal_source_link", {
        p_source_goal_id: "99000000-0000-4000-8000-000000000001",
        p_target_goal_id: "goal-main-1",
      });
      expect(rpcMock).toHaveBeenNthCalledWith(3, "replace_goal_source_link", {
        p_source_goal_id: "99000000-0000-4000-8000-000000000001",
        p_target_goal_id: "goal-main-1",
      });
      expect(invalidatePlannerRelatedTabCachesMock).toHaveBeenCalledTimes(1);
      expect(requestXpRefreshMock).toHaveBeenCalledTimes(1);
      expect(toastSuccessMock).toHaveBeenCalledWith("Goal created.");
    } finally {
      randomUuidSpy.mockRestore();
    }
  });

  it("retains a stable goal id when create_goal rejects ambiguously", async () => {
    const randomUuidSpy = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("99000000-0000-4000-8000-000000000002");
    const onExit = vi.fn();
    rpcMock
      .mockRejectedValueOnce(new Error("create request timed out"))
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();

    try {
      render(<GoalForm showBackButton={false} onExit={onExit} />);
      await screen.findByText("New goal");
      await user.type(screen.getByLabelText("Name"), "Stable goal");
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Retry creating goal" })).toBeInTheDocument();
      });
      expect(onExit).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "Retry creating goal" }));

      await waitFor(() => {
        expect(onExit).toHaveBeenCalledTimes(1);
      });
      expect(rpcMock).toHaveBeenNthCalledWith(
        1,
        "create_goal",
        expect.objectContaining({
          p_id: "99000000-0000-4000-8000-000000000002",
        })
      );
      expect(rpcMock).toHaveBeenNthCalledWith(
        2,
        "create_goal",
        expect.objectContaining({
          p_id: "99000000-0000-4000-8000-000000000002",
        })
      );
      expect(rpcMock).toHaveBeenNthCalledWith(3, "replace_goal_source_link", {
        p_source_goal_id: "99000000-0000-4000-8000-000000000002",
        p_target_goal_id: undefined,
      });
    } finally {
      randomUuidSpy.mockRestore();
    }
  });
});
