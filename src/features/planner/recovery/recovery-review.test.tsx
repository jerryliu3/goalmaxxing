import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RecoverySession, RecoverySnapshot } from "@/lib/planner/recovery/contract";
import { REBALANCE_FALLBACK } from "@/lib/planner/recovery/model";
import { RecoveryBar, RecoveryPrompt } from "@/features/planner/recovery/recovery-entry";
import { RecoveryReviewPanel } from "@/features/planner/recovery/recovery-review-panel";
import type { DraftMove } from "@/features/planner/recovery/review-state";
import { useRecoveryReview } from "@/features/planner/recovery/use-recovery-review";

const mocks = vi.hoisted(() => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
  savePlannerDraft: vi.fn(),
  onSaved: vi.fn(),
  onRequestHandled: vi.fn(),
  onLensChange: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  getJson: mocks.getJson,
  postJson: mocks.postJson,
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const RUN = "11111111-1111-4111-8111-111111111111";
const READ = "22222222-2222-4222-8222-222222222222";

function session(goalId: string, date: string, label: string, status: RecoverySession["status"], windowEnd: string | null = null): RecoverySession {
  return { id: `${goalId}:${date}`, goalId, unitKey: `${goalId}-${date}`, date, label, status, locked: false, windowEnd };
}

function snapshot(sessions: RecoverySession[]): RecoverySnapshot {
  return {
    today: "2026-10-07",
    horizonEnd: "2026-11-17",
    blackoutRanges: [],
    goals: [
      { id: READ, title: "Reading", kind: "deadline_total", interval: null, endDate: "2026-10-20", restDays: [], completedDates: [] },
      { id: RUN, title: "Running", kind: "cadence", interval: "weekly", endDate: null, restDays: [], completedDates: [] },
    ],
    sessions,
  };
}

const readMissed = session(READ, "2026-10-06", "Session 1 of 3", "missed", "2026-10-20");
const runMissed = session(RUN, "2026-10-05", "Session 1 of 2", "missed", "2026-10-11");
const runLater = session(RUN, "2026-10-09", "Session 2 of 2", "scheduled");
const slipped = snapshot([readMissed, runMissed, runLater]);

/** Stands in for the calendar: the planner draft is a list of moves. */
function Harness({ draft: initialDraft = [], requested = false }: { draft?: DraftMove[]; requested?: boolean }) {
  const [draft, setDraft] = useState<DraftMove[]>(initialDraft);
  const stageMoves = useCallback((moves: DraftMove[]) => {
    setDraft((current) => [
      ...current.filter((item) => !moves.some((move) => move.goalId === item.goalId && move.unitKey === item.unitKey)),
      ...moves,
    ]);
  }, []);
  const unstageMoves = useCallback((entries: Array<{ goalId: string; unitKey: string }>) => {
    setDraft((current) =>
      current.filter((item) => !entries.some((entry) => entry.goalId === item.goalId && entry.unitKey === item.unitKey))
    );
  }, []);
  const savePlannerDraft = useCallback(async () => {
    const ok = await mocks.savePlannerDraft(draft);
    if (ok) setDraft([]);
    return ok;
  }, [draft]);
  const discardPlannerDraft = useCallback(() => setDraft([]), []);
  const review = useRecoveryReview({
    enabled: true,
    refreshKey: "k",
    plannerDraftPending: draft.length > 0,
    draftMoves: draft,
    requested,
    onRequestHandled: mocks.onRequestHandled,
    onLensChange: mocks.onLensChange,
    onSaved: mocks.onSaved,
    stageMoves,
    unstageMoves,
    savePlannerDraft,
    discardPlannerDraft,
  });
  return (
    <>
      <RecoveryPrompt review={review} />
      <RecoveryBar review={review} />
      <RecoveryReviewPanel review={review} />
      <button
        type="button"
        onClick={() =>
          stageMoves([{ goalId: RUN, unitKey: `${RUN}-2026-10-09`, sourceDate: "2026-10-09", scheduledDate: "2026-10-12" }])
        }
      >
        Drag Running session 2 on the calendar
      </button>
      <output data-testid="draft">{JSON.stringify(draft)}</output>
    </>
  );
}

const draftMoves = () => JSON.parse(screen.getByTestId("draft").textContent ?? "[]") as DraftMove[];
const bar = () => within(screen.getByRole("region", { name: "Recovery mode" }));

describe("recovery mode", () => {
  beforeEach(() => {
    mocks.getJson.mockResolvedValue({ snapshot: slipped });
    mocks.savePlannerDraft.mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows nothing on Agenda when no session slipped", async () => {
    mocks.getJson.mockResolvedValue({ snapshot: snapshot([runLater]) });
    render(<Harness />);
    await waitFor(() => expect(mocks.getJson).toHaveBeenCalledWith("/api/planner/recovery"));
    expect(screen.queryByTestId("recovery-entry")).toBeNull();
  });

  it("stages every decision as a draft and saves them all with one Save", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(await screen.findByRole("button", { name: "2 sessions slipped · Review" }));
    expect(screen.getByRole("region", { name: "Recovery mode" })).toHaveTextContent("2 left");
    // The prompt steps aside while the bar owns recovery mode.
    expect(screen.queryByTestId("recovery-entry")).toBeNull();
    expect(screen.getByText("Goal 1 of 2")).toBeInTheDocument();
    expect(mocks.onLensChange).toHaveBeenLastCalledWith({
      goalIds: [READ, RUN],
      showFullCalendar: false,
      letGoEntryKeys: [],
    });

    await user.click(screen.getByRole("button", { name: "Accept Session 1 of 3 on Wed Oct 7" }));
    expect(draftMoves()).toEqual([
      { goalId: READ, unitKey: `${READ}-2026-10-06`, sourceDate: "2026-10-06", scheduledDate: "2026-10-07" },
    ]);
    expect(screen.getByText("Moves to Wed Oct 7")).toBeInTheDocument();
    expect(screen.getByText("All set for Reading.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Recovery mode" })).toHaveTextContent("1 left");

    await user.click(screen.getByRole("button", { name: "Undo Session 1 of 3 moved to Wed Oct 7" }));
    expect(draftMoves()).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Accept Session 1 of 3 on Wed Oct 7" }));

    await user.click(screen.getByRole("button", { name: "Next goal" }));
    await user.click(screen.getByRole("button", { name: "Let go of Session 1 of 2 missed Mon Oct 5" }));
    expect(screen.getByText("Let go")).toBeInTheDocument();
    expect(mocks.onLensChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ letGoEntryKeys: [`${RUN}:${RUN}-2026-10-05`] })
    );

    await user.click(screen.getByRole("button", { name: "Summary" }));
    expect(screen.getByText("Not saved yet: 1 moved · 1 let go.")).toBeInTheDocument();
    expect(mocks.postJson).not.toHaveBeenCalled();
    expect(mocks.savePlannerDraft).not.toHaveBeenCalled();

    mocks.postJson.mockResolvedValueOnce({ snapshot: snapshot([readMissed, runLater]) });
    await user.click(bar().getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("region", { name: "Recovery mode" })).toBeNull());
    expect(mocks.postJson).toHaveBeenCalledWith("/api/planner/recovery", {
      dismissals: [{ goalId: RUN, date: "2026-10-05" }],
    });
    expect(mocks.savePlannerDraft).toHaveBeenCalledWith([
      { goalId: READ, unitKey: `${READ}-2026-10-06`, sourceDate: "2026-10-06", scheduledDate: "2026-10-07" },
    ]);
    expect(mocks.onSaved).toHaveBeenCalledTimes(1);
  });

  it("hides the suggestions for the calendar and reads a calendar drag back as a change", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(await screen.findByRole("button", { name: "2 sessions slipped · Review" }));
    await user.click(screen.getByRole("button", { name: "Next goal" }));

    await user.click(bar().getByRole("button", { name: "Hide suggestions" }));
    expect(screen.queryByTestId("recovery-review-panel")).toBeNull();
    await user.click(bar().getByRole("button", { name: "Show full calendar" }));
    expect(mocks.onLensChange).toHaveBeenLastCalledWith({
      goalIds: [READ, RUN],
      showFullCalendar: true,
      letGoEntryKeys: [],
    });
    await user.click(screen.getByRole("button", { name: "Drag Running session 2 on the calendar" }));
    await user.click(bar().getByRole("button", { name: "Show suggestions" }));

    expect(screen.getByRole("heading", { name: "Running" })).toBeInTheDocument();
    expect(screen.getByText("Later sessions shifted")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo shifted sessions of Running" }));
    expect(draftMoves()).toEqual([]);
  });

  it("stages Auto-rebalance as soon as it turns on and saves it with Save", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(await screen.findByRole("button", { name: "2 sessions slipped · Review" }));
    const rebalanced = [
      { goalId: READ, unitKey: `${READ}-2026-10-06`, sourceDate: "2026-10-06", scheduledDate: "2026-10-14" },
      { goalId: RUN, unitKey: `${RUN}-2026-10-05`, sourceDate: "2026-10-05", scheduledDate: "2026-10-08" },
      { goalId: RUN, unitKey: `${RUN}-2026-10-09`, sourceDate: "2026-10-09", scheduledDate: "2026-10-10" },
    ];

    await user.click(screen.getByRole("switch", { name: "Auto-rebalance" }));
    expect(draftMoves()).toEqual(rebalanced);
    expect(screen.getByRole("heading", { name: "Your plan is back on track." })).toBeInTheDocument();
    expect(screen.getByText("Later sessions shifted")).toBeInTheDocument();

    await user.click(bar().getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.savePlannerDraft).toHaveBeenCalledWith(rebalanced));
    await waitFor(() => expect(screen.queryByRole("region", { name: "Recovery mode" })).toBeNull());
  });

  it("lets go of a session with no day left when Auto-rebalance turns on, and takes it back when it turns off", async () => {
    const GYM = "33333333-3333-4333-8333-333333333333";
    const gymMissed = session(GYM, "2026-10-06", "Session 1 of 2", "missed", "2026-10-07");
    mocks.getJson.mockResolvedValue({
      snapshot: {
        ...snapshot([readMissed, runMissed, runLater, gymMissed, session(GYM, "2026-10-07", "Session 2 of 2", "scheduled")]),
        goals: [
          ...slipped.goals,
          { id: GYM, title: "Gym", kind: "cadence", interval: "daily", endDate: null, restDays: [], completedDates: [] },
        ],
      },
    });
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(await screen.findByRole("button", { name: "3 sessions slipped · Review" }));

    await user.click(screen.getByRole("switch", { name: "Auto-rebalance" }));
    const gym = within(screen.getByRole("region", { name: "Gym changes" }));
    expect(gym.getByText("Let go")).toBeInTheDocument();
    expect(gym.getByText(REBALANCE_FALLBACK)).toBeInTheDocument();
    expect(mocks.onLensChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ letGoEntryKeys: [`${GYM}:${GYM}-2026-10-06`] })
    );

    await user.click(screen.getByRole("switch", { name: "Auto-rebalance" }));
    expect(within(screen.getByRole("region", { name: "Gym changes" })).queryByText("Let go")).toBeNull();
    expect(mocks.onLensChange).toHaveBeenLastCalledWith(expect.objectContaining({ letGoEntryKeys: [] }));
  });

  it("removes only what Auto-rebalance staged when it turns off, and Cancel discards everything", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(await screen.findByRole("button", { name: "2 sessions slipped · Review" }));
    await user.click(screen.getByRole("button", { name: "Drag Running session 2 on the calendar" }));
    const drag = { goalId: RUN, unitKey: `${RUN}-2026-10-09`, sourceDate: "2026-10-09", scheduledDate: "2026-10-12" };

    await user.click(screen.getByRole("switch", { name: "Auto-rebalance" }));
    expect(draftMoves()).toHaveLength(3);
    await user.click(screen.getByRole("switch", { name: "Auto-rebalance" }));
    expect(draftMoves()).toEqual([drag]);
    expect(screen.getByText("Not saved yet: 1 later session shifted. 2 left for later.")).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Auto-rebalance" }));
    await user.click(screen.getByRole("button", { name: "Undo shifted sessions of Running" }));
    expect(draftMoves()).toHaveLength(2);

    await user.click(bar().getByRole("button", { name: "Cancel" }));
    expect(draftMoves()).toEqual([]);
    expect(screen.queryByRole("region", { name: "Recovery mode" })).toBeNull();
    expect(mocks.postJson).not.toHaveBeenCalled();
    expect(mocks.savePlannerDraft).not.toHaveBeenCalled();
  });

  it("stays in recovery mode with the moves still staged when the planner save fails", async () => {
    const user = userEvent.setup();
    mocks.savePlannerDraft.mockResolvedValue(false);
    render(<Harness />);
    await user.click(await screen.findByRole("button", { name: "2 sessions slipped · Review" }));
    await user.click(screen.getByRole("button", { name: "Accept Session 1 of 3 on Wed Oct 7" }));

    await user.click(bar().getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.savePlannerDraft).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("region", { name: "Recovery mode" })).toBeInTheDocument();
    expect(draftMoves()).toHaveLength(1);
  });

  it("keeps recovery mode closed while another planner draft is unsaved", async () => {
    render(
      <Harness draft={[{ goalId: RUN, unitKey: `${RUN}-2026-10-09`, sourceDate: "2026-10-09", scheduledDate: "2026-10-12" }]} />
    );
    const entry = await screen.findByRole("button", { name: "2 sessions slipped · Review" });
    expect(entry).toBeDisabled();
    expect(screen.getByText("Save or discard your changes to review")).toBeInTheDocument();
  });

  it("opens straight into recovery mode from the check-in deep link", async () => {
    render(<Harness requested />);
    expect(await screen.findByText("Goal 1 of 2")).toBeInTheDocument();
    expect(mocks.onRequestHandled).toHaveBeenCalledTimes(1);
  });
});
