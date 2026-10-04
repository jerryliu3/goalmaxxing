import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerCoachPanel } from "@/features/planner/coach/planner-coach-panel";
import type { PlannerCoachModel } from "@/features/planner/coach/coach-types";
import { buildBulkGoalDraftsFromLlmGoals } from "@/lib/goals/bulk-drafts";
import type { Goal } from "@/lib/goals/types";

const authGetUserMock = vi.hoisted(() => vi.fn());
const goalsOrderMock = vi.hoisted(() => vi.fn());
const fetchProgressContextMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: authGetUserMock,
    },
    from: () => {
      const query = {
        eq: vi.fn().mockReturnThis(),
        order: goalsOrderMock,
      };
      return {
        select: vi.fn(() => query),
      };
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

function buildCoachModel(
  overrides: Partial<PlannerCoachModel["state"]> = {}
): PlannerCoachModel {
  const actions: PlannerCoachModel["actions"] = {
    setCoachInput: vi.fn(),
    setSelectedSavedCoachConversationId: vi.fn(),
    sendCoachMessage: vi.fn().mockResolvedValue(undefined),
    saveCoachConversation: vi.fn().mockResolvedValue(undefined),
    restoreSavedCoachConversation: vi.fn().mockResolvedValue(undefined),
    startNewCoachConversation: vi.fn(),
    applyCoachProposal: vi.fn().mockResolvedValue(undefined),
    rejectCoachProposal: vi.fn(),
    requestCalendarEditsFromCoach: vi.fn(),
    undoCoachProposal: vi.fn().mockResolvedValue(undefined),
    generateCoachGoalDrafts: vi.fn().mockResolvedValue(undefined),
    createCoachGoalDrafts: vi.fn().mockResolvedValue(undefined),
    setCoachGoalDrafts: vi.fn(),
    retryCoachGoalRefresh: vi.fn().mockResolvedValue(undefined),
    resetForPlannerStateReset: vi.fn(),
    onDraftDiscarded: vi.fn(),
  };

  return {
    state: {
      canUseCoach: true,
      coachLoading: false,
      coachInput: "",
      coachMessages: [],
      savedCoachConversations: [],
      selectedSavedCoachConversationId: "",
      coachConversationsLoading: false,
      coachConversationSaving: false,
      coachConversationRestoring: false,
      coachWarnings: [],
      coachRecommendations: [],
      coachUnresolvedQuestions: [],
      coachPolicyApplying: false,
      coachGoalDraftStates: {},
      hasPendingCalendarEdits: false,
      coachGoalRefreshStatus: "idle",
      coachGoalRefreshError: null,
      hasCoachConversationState: false,
      ...overrides,
    },
    actions,
  };
}

function renderCoachPanel(coach: PlannerCoachModel) {
  const view = render(<PlannerCoachPanel coach={coach} />);
  if (coach.state.canUseCoach) {
    fireEvent.click(screen.getByRole("button", { name: "Show AI Coach" }));
  }
  return view;
}

describe("planner coach panel", () => {
  beforeEach(() => {
    authGetUserMock.mockReset();
    goalsOrderMock.mockReset();
    fetchProgressContextMock.mockReset();
    authGetUserMock.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
    });
    goalsOrderMock.mockResolvedValue({ data: [], error: null });
    fetchProgressContextMock.mockResolvedValue({
      summaries: [],
      facts: [],
      truncated: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("does not render when coach capability is unavailable", () => {
    const coach = buildCoachModel({ canUseCoach: false });
    renderCoachPanel(coach);
    expect(screen.queryByText("AI Coach")).not.toBeInTheDocument();
  });

  it("starts collapsed until the user opens it", () => {
    render(<PlannerCoachPanel coach={buildCoachModel()} />);
    expect(screen.getByRole("button", { name: "Show AI Coach" })).toBeInTheDocument();
    expect(screen.getByText("AI Coach")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send to coach" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show AI Coach" }));
    expect(screen.getByRole("button", { name: "Send to coach" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide AI Coach" })).toBeInTheDocument();
  });

  it("wires save and send actions", async () => {
    const coach = buildCoachModel({
      coachInput: "Help me schedule runs",
      coachMessages: [
        {
          role: "user",
          content: "Help me schedule runs",
          createdAt: Date.now(),
        },
      ],
      hasCoachConversationState: true,
    });
    const user = userEvent.setup();

    renderCoachPanel(coach);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(coach.actions.saveCoachConversation).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("button", { name: "Save" }).parentElement).toBe(
      screen.getByRole("button", { name: "New convo" }).parentElement
    );
    expect(screen.getByRole("option", { name: "Load convo" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Send to coach" }));
    expect(coach.actions.sendCoachMessage).toHaveBeenCalledTimes(1);
  });

  it("wires restore and proposal actions", async () => {
    const coach = buildCoachModel({
      coachMessages: [
        {
          role: "assistant",
          content: "Let's update your spacing strategy.",
          createdAt: 123,
          proposal: {
            schemaVersion: "1",
            applyStatus: "auto_applied",
            patchSignature:
              "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            baselineSnapshotToken:
              "policy:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            baselinePolicy: {
              schemaVersion: "1",
              timezone: "UTC",
              timezoneConfirmedAt: "2026-08-01T00:00:00.000Z",
              restWeekdays: [],
              blackoutRanges: [],
            },
            policyPatches: [
              {
                kind: "set_rest_weekdays",
                restWeekdays: [2, 4],
              },
            ],
            unresolvedQuestions: [],
          },
        },
      ],
      savedCoachConversations: [
        {
          id: "conversation-1",
          scopeMonth: "2026-08",
          timezone: "UTC",
          title: "Saved chat",
          previewText: "Help me train",
          messageCount: 2,
          createdAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-02T00:00:00.000Z",
        },
      ],
    });
    const user = userEvent.setup();

    renderCoachPanel(coach);
    expect(screen.queryByRole("button", { name: "Restore" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Saved conversations")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Saved conversations"), "conversation-1");
    expect(coach.actions.setSelectedSavedCoachConversationId).toHaveBeenCalledWith(
      "conversation-1"
    );
    expect(coach.actions.restoreSavedCoachConversation).toHaveBeenCalledWith("conversation-1");

    await user.click(screen.getByRole("button", { name: "Re-apply changes" }));
    expect(coach.actions.applyCoachProposal).toHaveBeenCalledWith(0);

    await user.click(screen.getByRole("button", { name: "Undo proposal" }));
    expect(coach.actions.undoCoachProposal).toHaveBeenCalledWith(0);
  });

  it("renders editable goal drafts inline and creates selected goals", async () => {
    const drafts = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Easy run",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        start_date: "2026-08-17",
        end_date: "2026-09-13",
      },
    ]);
    const coach = buildCoachModel({
      coachMessages: [
        {
          role: "assistant",
          content: "I drafted your running plan.",
          createdAt: 123,
          proposal: {
            schemaVersion: "1",
            kind: "goal_draft",
            proposalId: "32000000-0000-4000-8000-000000000001",
            parserPrompt: "Easy run weekly for four weeks.",
            creationStatus: "not_created",
          },
        },
      ],
      coachGoalDraftStates: {
        0: { status: "ready", drafts, warnings: [] },
      },
    });
    const user = userEvent.setup();

    renderCoachPanel(coach);

    expect(screen.getByText("Easy run")).toBeInTheDocument();
    expect(screen.getByText("Weekly · Aug 17 – Sep 13")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Create selected goals" })
    );
    expect(coach.actions.createCoachGoalDrafts).toHaveBeenCalledWith(0);
  });

  it("passes active user-scoped linkable goals into the shared draft editor", async () => {
    const drafts = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Easy run",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        start_date: "2026-08-17",
      },
    ]);
    drafts[0] = {
      ...drafts[0]!,
      linked_target_goal_id: "goal-main-1",
    };
    const availableGoal: Goal = {
      id: "goal-main-1",
      owner_id: "user-1",
      title: "Main Goal",
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
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    };
    goalsOrderMock.mockResolvedValueOnce({
      data: [availableGoal],
      error: null,
    });
    fetchProgressContextMock.mockResolvedValueOnce({
      summaries: [{ goalId: "goal-main-1", lifecycle: "active" }],
      facts: [],
      truncated: false,
    });
    const coach = buildCoachModel({
      coachMessages: [
        {
          role: "assistant",
          content: "I drafted your running plan.",
          createdAt: 123,
          proposal: {
            schemaVersion: "1",
            kind: "goal_draft",
            proposalId: "32000000-0000-4000-8000-000000000101",
            parserPrompt: "Easy run weekly.",
            creationStatus: "not_created",
          },
        },
      ],
      coachGoalDraftStates: {
        0: { status: "ready", drafts, warnings: [] },
      },
    });
    const user = userEvent.setup();

    renderCoachPanel(coach);
    await waitFor(() => expect(goalsOrderMock).toHaveBeenCalledTimes(1));

    await user.click(screen.getAllByRole("button", { name: /tap to edit/i })[0]!);
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /advanced settings/i })
    );
    expect(
      within(dialog).getByText(/Linking this subgoal to Main Goal may hide/i)
    ).toBeInTheDocument();
  });

  it("passes an empty linkable-goal list to the shared draft editor", async () => {
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
    goalsOrderMock.mockResolvedValueOnce({
      data: [],
      error: null,
    });
    fetchProgressContextMock.mockResolvedValueOnce({
      summaries: [],
      facts: [],
      truncated: false,
    });
    const coach = buildCoachModel({
      coachMessages: [
        {
          role: "assistant",
          content: "I drafted a mobility plan.",
          createdAt: 456,
          proposal: {
            schemaVersion: "1",
            kind: "goal_draft",
            proposalId: "32000000-0000-4000-8000-000000000102",
            parserPrompt: "Mobility weekly.",
            creationStatus: "not_created",
          },
        },
      ],
      coachGoalDraftStates: {
        0: { status: "ready", drafts, warnings: [] },
      },
    });
    const user = userEvent.setup();

    renderCoachPanel(coach);
    await waitFor(() => expect(goalsOrderMock).toHaveBeenCalledTimes(1));
    await user.click(screen.getAllByRole("button", { name: /tap to edit/i })[0]!);
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /advanced settings/i })
    );
    expect(
      within(dialog).getByText("Make this a subgoal linked to...")
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(/Linking this subgoal to/i)
    ).not.toBeInTheDocument();
  });

  it("renders malformed proposal payloads without crashing", () => {
    const coach = buildCoachModel({
      coachMessages: [
        {
          role: "assistant",
          content: "Legacy payload shape.",
          createdAt: 456,
          proposal: {
            applyStatus: "not_applied",
            baselinePolicy: null,
          } as unknown as NonNullable<
            PlannerCoachModel["state"]["coachMessages"][number]["proposal"]
          >,
        },
      ],
    });

    renderCoachPanel(coach);
    expect(screen.getByText("0 draft changes available.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply changes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Undo proposal" })).toBeDisabled();
  });

  it("renders generate action for proposals without runtime draft state", async () => {
    const coach = buildCoachModel({
      coachMessages: [
        {
          role: "assistant",
          content: "I can draft this plan.",
          createdAt: 123,
          proposal: {
            schemaVersion: "1",
            kind: "goal_draft",
            proposalId: "32000000-0000-4000-8000-000000000010",
            parserPrompt: "Easy run weekly for four weeks.",
            creationStatus: "not_created",
          },
        },
      ],
    });
    const user = userEvent.setup();

    renderCoachPanel(coach);
    expect(
      screen.getByText(/Drafts are not generated yet/)
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Generate editable drafts" })
    );
    expect(coach.actions.generateCoachGoalDrafts).toHaveBeenCalledWith(0);
  });

  it("keeps generated drafts visible but disables creation for calendar edits", () => {
    const drafts = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Mobility",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        start_date: "2026-08-17",
      },
    ]);
    const coach = buildCoachModel({
      hasPendingCalendarEdits: true,
      coachMessages: [
        {
          role: "assistant",
          content: "I drafted a mobility goal.",
          createdAt: 123,
          proposal: {
            schemaVersion: "1",
            kind: "goal_draft",
            proposalId: "32000000-0000-4000-8000-000000000002",
            parserPrompt: "Mobility weekly.",
            creationStatus: "not_created",
          },
        },
      ],
      coachGoalDraftStates: {
        0: { status: "ready", drafts, warnings: [] },
      },
    });

    renderCoachPanel(coach);

    expect(screen.getByText("Mobility")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create selected goals" })
    ).toBeDisabled();
    expect(
      screen.getByText("Save or discard calendar edits first.")
    ).toBeInTheDocument();
  });

  it("shows typed parser failures with a retry action", async () => {
    const coach = buildCoachModel({
      coachMessages: [
        {
          role: "assistant",
          content: "I drafted a plan.",
          createdAt: 123,
          proposal: {
            schemaVersion: "1",
            kind: "goal_draft",
            proposalId: "32000000-0000-4000-8000-000000000003",
            parserPrompt: "Mobility weekly.",
            creationStatus: "not_created",
          },
        },
      ],
      coachGoalDraftStates: {
        0: {
          status: "error",
          drafts: [],
          warnings: [],
          errorCode: "quota_exceeded",
          errorMessage: "Daily limit reached.",
        },
      },
    });
    const user = userEvent.setup();

    renderCoachPanel(coach);

    expect(
      screen.getByText(/AI goal draft limit has been reached/)
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Generate again" }));
    expect(coach.actions.generateCoachGoalDrafts).toHaveBeenCalledWith(0);
  });

  it("offers link recovery without marking the coach proposal created", async () => {
    const coach = buildCoachModel({
      coachMessages: [
        {
          role: "assistant",
          content: "I drafted a plan.",
          createdAt: 123,
          proposal: {
            schemaVersion: "1",
            kind: "goal_draft",
            proposalId: "32000000-0000-4000-8000-000000000012",
            parserPrompt: "Mobility weekly.",
            creationStatus: "not_created",
          },
        },
      ],
      coachGoalDraftStates: {
        0: {
          status: "error",
          drafts: buildBulkGoalDraftsFromLlmGoals([
            {
              title: "Mobility",
              frequency_type: "recurring",
              recurrence_interval: "weekly",
              start_date: "2026-08-17",
            },
          ]),
          warnings: [],
          errorCode: "links_ambiguous",
          errorMessage: "Some linked goals were not saved: link save failed",
          pendingLinkRecovery: {
            createdCount: 1,
            preparedRows: [],
            linkRows: [
              {
                source_goal_id: "goal-created-1",
                target_goal_id: "goal-main-1",
              },
            ],
          },
        },
      },
    });
    const user = userEvent.setup();

    renderCoachPanel(coach);

    expect(screen.getByText(/links could not be confirmed/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry saving links" }));
    expect(coach.actions.createCoachGoalDrafts).toHaveBeenCalledWith(0);
  });

  it("does not offer retry when parser returns too many goals", () => {
    const coach = buildCoachModel({
      coachMessages: [
        {
          role: "assistant",
          content: "I drafted a plan.",
          createdAt: 123,
          proposal: {
            schemaVersion: "1",
            kind: "goal_draft",
            proposalId: "32000000-0000-4000-8000-000000000011",
            parserPrompt: "Too many goals prompt.",
            creationStatus: "not_created",
          },
        },
      ],
      coachGoalDraftStates: {
        0: {
          status: "error",
          drafts: [],
          warnings: [],
          errorCode: "too_many_goals",
          errorMessage: "Too many goals.",
        },
      },
    });

    renderCoachPanel(coach);

    expect(screen.getByText(/proposed more than five goals/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Generate again" })
    ).not.toBeInTheDocument();
  });

  it("labels created goals as persisted and not undoable here", () => {
    const coach = buildCoachModel({
      coachMessages: [
        {
          role: "assistant",
          content: "I drafted a plan.",
          createdAt: 123,
          proposal: {
            schemaVersion: "1",
            kind: "goal_draft",
            proposalId: "32000000-0000-4000-8000-000000000004",
            parserPrompt: "Mobility weekly.",
            creationStatus: "created",
          },
        },
      ],
    });

    renderCoachPanel(coach);

    expect(
      screen.getByText(
        "Goals created. This action is not undoable here; edit or delete them from Goals."
      )
    ).toBeInTheDocument();
  });

  it("blocks new turns but keeps conversation controls available after refresh failure", async () => {
    const coach = buildCoachModel({
      coachInput: "Move my new session",
      coachMessages: [
        {
          role: "user",
          content: "Create a goal",
          createdAt: 1,
        },
      ],
      hasCoachConversationState: true,
      savedCoachConversations: [
        {
          id: "conversation-1",
          scopeMonth: "2026-08",
          timezone: "UTC",
          title: "Saved chat",
          previewText: "Create a goal",
          messageCount: 1,
          createdAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-02T00:00:00.000Z",
        },
      ],
      coachGoalRefreshStatus: "failed",
      coachGoalRefreshError: "Planner prepare failed.",
    });
    const user = userEvent.setup();

    renderCoachPanel(coach);

    expect(
      screen.getByRole("button", { name: "Send to coach" })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "New convo" })).toBeEnabled();
    expect(screen.getByLabelText("Saved conversations")).toBeEnabled();
    expect(screen.getByText(/Planner prepare failed/)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Retry calendar refresh" })
    );
    expect(coach.actions.retryCoachGoalRefresh).toHaveBeenCalledTimes(1);
  });
});
