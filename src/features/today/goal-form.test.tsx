vi.mock("@/features/coach/use-coach-page-context", () => ({ useCoachPageContext: vi.fn() }));
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoalCreationFieldControls } from "@/features/goals/goal-creation-fields";
import {
  createDefaultGoalCreationFields,
  getGoalCreationValidationFeedback,
} from "@/lib/goals/creation-model";
import { GoalCardEditor } from "@/features/goals/card-editor/goal-card-editor";
import { GoalForm } from "@/features/today/goal-form";
import { resolveGoalDefinitionValidationFeedback } from "@/lib/goals/definition-validation";
import { validateGoalDefinition } from "@/lib/goals/definition-validation";
import type { Goal } from "@/lib/goals/types";

async function chooseRequiredGoalFields(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Career" }));
  await user.click(screen.getByRole("button", { name: /Medium · a good push/ }));
  await user.click(screen.getByRole("button", { name: /03Rhythm/ }));
  await user.click(await screen.findByRole("button", { name: /A repeating rhythm/ }));
  await user.click(screen.getByRole("button", { name: "Daily" }));
}

const authGetUserMock = vi.hoisted(() => vi.fn());
const goalsOrderMock = vi.hoisted(() => vi.fn());
const goalSingleMock = vi.hoisted(() => vi.fn());
const goalLinksMock = vi.hoisted(() => vi.fn());
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
      if (table === "goal_links") {
        const query = {
          eq: vi.fn().mockReturnThis(),
          then: (
            resolve: (value: unknown) => unknown,
            reject: (reason: unknown) => unknown,
          ) => Promise.resolve(goalLinksMock()).then(resolve, reject),
        };
        return { select: vi.fn(() => query) };
      }
      const query = {
        eq: vi.fn().mockReturnThis(),
        order: goalsOrderMock,
        single: goalSingleMock,
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
  const actual = await vi.importActual<
    typeof import("@/lib/goals/progress-context")
  >("@/lib/goals/progress-context");
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
  goalSingleMock.mockReset().mockResolvedValue({
    data: null,
    error: null,
  });
  goalLinksMock.mockReset().mockResolvedValue({
    data: [],
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
        testCase.message,
      );
      expect(
        feedback.validationWarning,
        testCase.recurrenceInterval,
      ).toBeNull();
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
      />,
    );

    expect(
      screen.getByText(
        "Goal type, frequency, and start date are fixed after creation. Archive this goal and create a new one to change them.",
      ),
    ).toBeInTheDocument();

    const comboboxes = screen.getAllByRole("combobox");
    const goalTypeCombobox = comboboxes.find((element) =>
      element.textContent?.includes("Recurring"),
    );
    const frequencyCombobox = comboboxes.find((element) =>
      element.textContent?.includes("Weekly"),
    );
    const targetField = document.querySelector<HTMLInputElement>(
      "#recurring-target-count",
    );

    expect(goalTypeCombobox).toBeDefined();
    expect(goalTypeCombobox).toBeDisabled();
    expect(frequencyCombobox).toBeDefined();
    expect(frequencyCombobox).toBeDisabled();
    expect(targetField).toBeTruthy();
    expect(targetField).not.toBeDisabled();
    expect(screen.getByLabelText("Start date")).toBeDisabled();
    expect(screen.getByLabelText("End date (optional)")).not.toBeDisabled();
  });
});

describe("GoalForm target validation", () => {
  it("uses strict target parsing instead of truncating fractional input", () => {
    const feedback = getGoalCreationValidationFeedback({
      ...createDefaultGoalCreationFields(),
      title: "Weekly goal",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_basis: "period",
      target_count: "1.5",
      start_date: "2026-08-17",
    });
    expect(feedback.validationError).toBe(
      "Per-period target must be a positive whole number.",
    );
  });

  it("blocks an empty lifetime recurring target", () => {
    const feedback = getGoalCreationValidationFeedback({
      ...createDefaultGoalCreationFields(),
      title: "Daily lifetime goal",
      frequency_type: "recurring",
      recurrence_interval: "daily",
      target_basis: "lifetime",
      target_count: "",
      start_date: "2026-08-17",
    });
    expect(feedback.validationError).toBe(
      "Total target completions requires a positive target.",
    );
  });

  it("blocks lifetime targets below existing completions", () => {
    const feedback = getGoalCreationValidationFeedback(
      {
        ...createDefaultGoalCreationFields(),
        title: "Daily lifetime goal",
        frequency_type: "recurring",
        recurrence_interval: "daily",
        target_basis: "lifetime",
        target_count: "50",
        start_date: "2026-08-17",
        end_date: "2026-12-31",
      },
      { completedCount: 200 },
    );
    expect(feedback.validationError).toBe(
      "Target cannot be below 200 existing completions.",
    );
  });

  it("blocks milestone targets below existing completions", () => {
    const feedback = getGoalCreationValidationFeedback(
      {
        ...createDefaultGoalCreationFields(),
        title: "Milestones",
        frequency_type: "fixed_milestones",
        target_count: "2",
        milestone_names: ["One", "Two"],
        start_date: "2026-08-17",
        end_date: "2026-12-31",
      },
      { completedCount: 3 },
    );
    expect(feedback.validationError).toBe(
      "Target cannot be below 3 existing completions.",
    );
  });

  it("does not apply the completion floor to period targets", () => {
    const feedback = getGoalCreationValidationFeedback(
      {
        ...createDefaultGoalCreationFields(),
        title: "Weekly goal",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_basis: "period",
        target_count: "3",
        start_date: "2026-08-17",
        end_date: "2026-12-31",
      },
      { completedCount: 200 },
    );
    expect(feedback.validationError).toBeNull();
  });

  it("credits existing completions in remaining lifetime capacity warnings", () => {
    const fields = {
      ...createDefaultGoalCreationFields(),
      title: "Daily lifetime goal",
      frequency_type: "recurring" as const,
      recurrence_interval: "daily" as const,
      target_basis: "lifetime" as const,
      target_count: "6",
      start_date: "2026-08-01",
      end_date: "2026-08-07",
    };
    const capacity = {
      asOfDate: "2026-08-01",
      capacity: {
        restWeekdays: [0, 6],
        blackoutRanges: [] as Array<{ start: string; end: string }>,
      },
    };

    expect(
      getGoalCreationValidationFeedback(fields, capacity).validationWarning,
    ).toContain("6 sessions");
    expect(
      getGoalCreationValidationFeedback(fields, {
        ...capacity,
        completedCount: 2,
      }).validationWarning,
    ).toBeNull();
  });

  it("credits current-period completions in remaining period capacity warnings", () => {
    const fields = {
      ...createDefaultGoalCreationFields(),
      title: "Weekly goal",
      frequency_type: "recurring" as const,
      recurrence_interval: "weekly" as const,
      target_basis: "period" as const,
      target_count: "6",
      start_date: "2026-08-03",
      end_date: "2026-08-09",
    };
    const capacity = {
      asOfDate: "2026-08-03",
      capacity: {
        restWeekdays: [0, 6],
        blackoutRanges: [] as Array<{ start: string; end: string }>,
      },
    };

    expect(
      getGoalCreationValidationFeedback(fields, capacity).validationWarning,
    ).toContain("6 sessions");
    expect(
      getGoalCreationValidationFeedback(fields, {
        ...capacity,
        currentPeriodCompletedCount: 2,
      }).validationWarning,
    ).toBeNull();
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
      .mockRejectedValueOnce({})
      .mockResolvedValueOnce({ error: null });
    const user = userEvent.setup({ delay: null });

    try {
      render(<GoalForm showBackButton={false} onExit={onExit} />);
      await screen.findByLabelText("Name");
      await user.type(screen.getByLabelText("Name"), "Daily reset");
      await chooseRequiredGoalFields(user);
      await user.click(screen.getByRole("button", { name: /04Schedule/ }));
      await user.click(await screen.findByText("Advanced settings (optional)"));
      await user.click(
        screen.getByRole("button", { name: "Select link target" }),
      );
      await user.click(screen.getByRole("button", { name: /05Review/ }));
      await user.click(screen.getByRole("button", { name: "Create goal" }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Retry saving link" }),
        ).toBeInTheDocument();
      });
      expect(toastSuccessMock).not.toHaveBeenCalled();
      expect(onExit).not.toHaveBeenCalled();
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Could not save the selected goal link. Try again.",
      );
      expect(invalidatePlannerRelatedTabCachesMock).toHaveBeenCalledTimes(1);

      await user.click(
        screen.getByRole("button", { name: "Retry saving link" }),
      );

      await waitFor(() => {
        expect(onExit).toHaveBeenCalledTimes(1);
      });
      const createGoalCalls = rpcMock.mock.calls.filter(
        ([method]) => method === "create_goal",
      );
      expect(createGoalCalls).toHaveLength(1);
      const stableGoalId = createGoalCalls[0]?.[1]?.p_id;
      expect(stableGoalId).toEqual(expect.any(String));
      expect(createGoalCalls[0]?.[1]).toMatchObject({
        p_id: stableGoalId,
        p_title: "Daily reset",
      });
      expect(rpcMock).toHaveBeenNthCalledWith(2, "replace_goal_source_link", {
        p_source_goal_id: stableGoalId,
        p_target_goal_id: "goal-main-1",
      });
      expect(rpcMock).toHaveBeenNthCalledWith(3, "replace_goal_source_link", {
        p_source_goal_id: stableGoalId,
        p_target_goal_id: "goal-main-1",
      });
      expect(invalidatePlannerRelatedTabCachesMock).toHaveBeenCalledTimes(2);
      expect(requestXpRefreshMock).toHaveBeenCalledTimes(1);
      expect(toastSuccessMock).toHaveBeenCalledWith("Goal created.");
    } finally {
      randomUuidSpy.mockRestore();
    }
  }, 15_000);

  it("retains a stable goal id when create_goal rejects ambiguously", async () => {
    const randomUuidSpy = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("99000000-0000-4000-8000-000000000002");
    const onExit = vi.fn();
    rpcMock
      .mockRejectedValueOnce(new Error("create request timed out"))
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });
    const user = userEvent.setup({ delay: null });

    try {
      render(<GoalForm showBackButton={false} onExit={onExit} />);
      await screen.findByLabelText("Name");
      await user.type(screen.getByLabelText("Name"), "Stable goal");
      await chooseRequiredGoalFields(user);
      await user.click(screen.getByRole("button", { name: /05Review/ }));
      await user.click(screen.getByRole("button", { name: "Create goal" }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Retry creating goal" }),
        ).toBeInTheDocument();
      });
      expect(onExit).not.toHaveBeenCalled();

      await user.click(
        screen.getByRole("button", { name: "Retry creating goal" }),
      );

      await waitFor(() => {
        expect(onExit).toHaveBeenCalledTimes(1);
      });
      const createGoalCalls = rpcMock.mock.calls.filter(
        ([method]) => method === "create_goal",
      );
      expect(createGoalCalls).toHaveLength(2);
      const stableGoalId = createGoalCalls[0]?.[1]?.p_id;
      expect(stableGoalId).toEqual(expect.any(String));
      expect(createGoalCalls[0]?.[1]).toMatchObject({
        p_id: stableGoalId,
        p_title: "Stable goal",
      });
      expect(createGoalCalls[1]?.[1]).toMatchObject({
        p_id: stableGoalId,
        p_title: "Stable goal",
      });
      expect(rpcMock).toHaveBeenNthCalledWith(3, "replace_goal_source_link", {
        p_source_goal_id: stableGoalId,
        p_target_goal_id: undefined,
      });
    } finally {
      randomUuidSpy.mockRestore();
    }
  }, 15_000);

  it("keeps a returned create error editable instead of creating recovery state", async () => {
    const randomUuidSpy = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("99000000-0000-4000-8000-000000000003");
    const onExit = vi.fn();
    rpcMock
      .mockResolvedValueOnce({ error: { message: null } })
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();

    try {
      render(<GoalForm showBackButton={false} onExit={onExit} />);
      await screen.findByLabelText("Name");
      await user.type(screen.getByLabelText("Name"), "Resolved error goal");
      await chooseRequiredGoalFields(user);
      await user.click(screen.getByRole("button", { name: /05Review/ }));
      await user.click(screen.getByRole("button", { name: "Create goal" }));

      expect(toastErrorMock).toHaveBeenCalledWith(
        "Could not save goal. Try again.",
      );
      expect(onExit).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("button", { name: "Retry creating goal" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /02Intention/ })).toBeEnabled();

      await user.click(screen.getByRole("button", { name: /05Review/ }));
      await user.click(screen.getByRole("button", { name: "Create goal" }));

      await waitFor(() => expect(onExit).toHaveBeenCalledTimes(1));
      expect(rpcMock).toHaveBeenNthCalledWith(
        1,
        "create_goal",
        expect.objectContaining({
          p_id: "99000000-0000-4000-8000-000000000003",
        }),
      );
      expect(rpcMock).toHaveBeenNthCalledWith(
        2,
        "create_goal",
        expect.objectContaining({
          p_id: "99000000-0000-4000-8000-000000000003",
        }),
      );
    } finally {
      randomUuidSpy.mockRestore();
    }
  });

  it("keeps the existing link selection and blocks saving when link candidates fail", async () => {
    const existingGoal: Goal = {
      ...activeLinkTarget,
      id: "goal-edit-1",
      title: "Existing goal",
    };
    goalsOrderMock.mockResolvedValueOnce({
      data: [],
      error: { message: "link candidates unavailable" },
    });
    goalSingleMock.mockResolvedValueOnce({
      data: existingGoal,
      error: null,
    });
    goalLinksMock.mockResolvedValueOnce({
      data: [
        {
          id: "link-1",
          owner_id: "user-1",
          source_goal_id: "goal-edit-1",
          target_goal_id: "goal-main-1",
          created_at: "2026-08-01T00:00:00.000Z",
        },
      ],
      error: null,
    });
    const user = userEvent.setup();

    render(<GoalCardEditor goalId="goal-edit-1" onExit={vi.fn()} onDismiss={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /Name\s*Existing goal/i }));
    await user.type(screen.getByLabelText("Goal name"), " renamed");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    expect(screen.getByText("link candidates unavailable")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry loading link targets" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("keeps the form editable after a definitive link error", async () => {
    rpcMock
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "link rejected" } });
    const onExit = vi.fn();
    const user = userEvent.setup();

    render(<GoalForm showBackButton={false} onExit={onExit} />);
    await screen.findByLabelText("Name");
    await user.type(screen.getByLabelText("Name"), "Editable link failure");
      await chooseRequiredGoalFields(user);
    await user.click(screen.getByRole("button", { name: /04Schedule/ }));
    await user.click(await screen.findByText("Advanced settings (optional)"));
    await user.click(
      screen.getByRole("button", { name: "Select link target" }),
    );
    await user.click(screen.getByRole("button", { name: /05Review/ }));
    await user.click(screen.getByRole("button", { name: "Create goal" }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("link rejected");
      expect(screen.getByRole("button", { name: /02Intention/ })).toBeEnabled();
    });
    expect(
      screen.queryByRole("button", { name: "Retry saving link" }),
    ).not.toBeInTheDocument();
    expect(onExit).not.toHaveBeenCalled();
    expect(invalidatePlannerRelatedTabCachesMock).toHaveBeenCalledTimes(1);
  });

  it("clears link recovery after a definitive retry error but retains it after rejected retries", async () => {
    rpcMock
      .mockResolvedValueOnce({ error: null })
      .mockRejectedValueOnce(new Error("link request timed out"))
      .mockResolvedValueOnce({ error: { message: "link no longer allowed" } });
    const onExit = vi.fn();
    const user = userEvent.setup();

    render(<GoalForm showBackButton={false} onExit={onExit} />);
    await screen.findByLabelText("Name");
    await user.type(screen.getByLabelText("Name"), "Retryable link failure");
      await chooseRequiredGoalFields(user);
    await user.click(screen.getByRole("button", { name: /04Schedule/ }));
    await user.click(await screen.findByText("Advanced settings (optional)"));
    await user.click(
      screen.getByRole("button", { name: "Select link target" }),
    );
    await user.click(screen.getByRole("button", { name: /05Review/ }));
    await user.click(screen.getByRole("button", { name: "Create goal" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Retry saving link" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /02Intention/ })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Retry saving link" }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("link no longer allowed");
      expect(screen.getByRole("button", { name: /02Intention/ })).toBeEnabled();
    });
    expect(
      screen.queryByRole("button", { name: "Retry saving link" }),
    ).not.toBeInTheDocument();
    expect(onExit).not.toHaveBeenCalled();
  });

  it("freezes fields and navigation while create persistence is pending", async () => {
    let resolveCreate: ((value: { error: null }) => void) | undefined;
    rpcMock.mockImplementationOnce(
      () =>
        new Promise<{ error: null }>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    rpcMock.mockResolvedValue({ error: null });
    const onExit = vi.fn();
    const user = userEvent.setup();

    render(<GoalForm onExit={onExit} />);
    await screen.findByLabelText("Name");
    await user.type(screen.getByLabelText("Name"), "Pending goal");
      await chooseRequiredGoalFields(user);
    await user.click(screen.getByRole("button", { name: /05Review/ }));
    await user.click(screen.getByRole("button", { name: "Create goal" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /02Intention/ }),
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();
    });
    expect(onExit).not.toHaveBeenCalled();

    resolveCreate?.({ error: null });
    await waitFor(() => expect(onExit).toHaveBeenCalledTimes(1));
  });

  it("retains recovery after a rejected update and retries the same update", async () => {
    const existingGoal: Goal = {
      ...activeLinkTarget,
      id: "goal-edit-2",
      title: "Existing goal",
    };
    goalSingleMock.mockResolvedValueOnce({
      data: existingGoal,
      error: null,
    });
    goalLinksMock.mockResolvedValueOnce({
      data: [],
      error: null,
    });
    rpcMock
      .mockRejectedValueOnce(new Error("update request timed out"))
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });
    const onExit = vi.fn();
    const user = userEvent.setup();

    render(<GoalCardEditor goalId="goal-edit-2" onExit={onExit} onDismiss={vi.fn()} />);
    await user.click(await screen.findByRole("button", { name: /Name\s*Existing goal/i }));
    await user.type(screen.getByLabelText("Goal name"), " renamed");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Retry saving goal" }),
      ).toBeInTheDocument();
    });
    expect(onExit).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith("update request timed out");

    await user.click(screen.getByRole("button", { name: "Retry saving goal" }));

    await waitFor(() => expect(onExit).toHaveBeenCalledTimes(1));
    expect(invalidatePlannerRelatedTabCachesMock).toHaveBeenCalledTimes(2);
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "update_goal",
      expect.objectContaining({ p_id: "goal-edit-2" }),
    );
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      "update_goal",
      expect.objectContaining({ p_id: "goal-edit-2" }),
    );
    expect(rpcMock).toHaveBeenNthCalledWith(3, "replace_goal_source_link", {
      p_source_goal_id: "goal-edit-2",
      p_target_goal_id: undefined,
    });
  });

  it("dismisses without using complete exit when archiving from the sheet", async () => {
    const existingGoal: Goal = {
      ...activeLinkTarget,
      id: "goal-archive-1",
      title: "Archive me",
      archived_at: null,
    };
    goalSingleMock.mockResolvedValueOnce({
      data: existingGoal,
      error: null,
    });
    goalLinksMock.mockResolvedValueOnce({
      data: [],
      error: null,
    });
    rpcMock.mockResolvedValueOnce({ error: null });
    const onExit = vi.fn();
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(<GoalCardEditor goalId="goal-archive-1" onExit={onExit} onDismiss={onDismiss} />);
    await user.click(await screen.findByRole("button", { name: "Turn over for more" }));
    await user.click(screen.getByRole("button", { name: "Archive goal" }));

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
    expect(onExit).not.toHaveBeenCalled();
    expect(rpcMock).toHaveBeenCalledWith("set_goal_archived", {
      p_goal_id: "goal-archive-1",
      p_archived: true,
    });
  });
});
