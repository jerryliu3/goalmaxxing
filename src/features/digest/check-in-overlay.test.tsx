import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckInOverlay } from "@/features/digest/check-in-overlay";
import { DIGEST_OPEN_EVENT } from "@/features/digest/digest-api";

const mocks = vi.hoisted(() => ({
  completedAt: null as string | null,
  getJson: vi.fn(),
  postJson: vi.fn(),
  push: vi.fn(),
  runCompletionMutation: vi.fn(),
}));

vi.mock("@/features/onboarding/onboarding-progress-provider", () => ({ useOnboardingProgress: () => ({ progress: { completed_at: mocks.completedAt } }) }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/lib/api/client", () => ({
  getJson: mocks.getJson,
  postJson: mocks.postJson,
  getApiErrorMessage: () => "error",
}));

vi.mock("@/features/planner/use-completion-mutation", () => ({
  useCompletionMutation: () => mocks.runCompletionMutation,
}));

const digestPayloadBase = {
  schemaVersion: "1" as const,
  id:"11111111-1111-4111-8111-111111111111",factsDigest:"facts",generatedAt:null,
  kind: "daily" as const,
  periodKey: "2026-09-09",
  localDate: "2026-09-09",
  digestAutoShow: true,
  acknowledged: false,
  shouldAutoShow: true,
  facts: {
    recap: {
      label: "Yesterday",
      start: "2026-09-08",
      end: "2026-09-08",
      placed: 1,
      completed: 0,
      estimatedMinutes: 30,
      items: [
        {
          goalId: "strength",
          title: "Strength",
          date: "2026-09-08",
          state: "open" as const,
        },
      ],
    },
    ahead: {
      label: "Today",
      start: "2026-09-09",
      end: "2026-09-09",
      placed: 2,
      completed: 0,
      estimatedMinutes: 60,
      items: [
        {
          goalId: "tempo",
          title: "Tempo run",
          date: "2026-09-09",
          state: "open" as const,
        },
      ],
    },
    recover: {
      count: 1,
      items: [
        {
          goalId: "strength",
          title: "Strength",
          date: "2026-09-08",
          state: "open" as const,
        },
      ],
    },
    unscheduled: { count: 0, titles: [] },
  },
  suggestions: null,
};

const digestPayload = { ...digestPayloadBase, historicalFacts: digestPayloadBase.facts };

function finishOnboarding() {
  mocks.completedAt = "2026-01-01T12:00:00Z";
}

describe("CheckInOverlay", () => {
  beforeEach(() => {
    mocks.completedAt = null;
    window.localStorage.clear();
    window.sessionStorage.clear();
    mocks.getJson.mockResolvedValue(digestPayload);
    mocks.postJson.mockImplementation(async (path: string) => path === "/api/digest/ack" ? { claimed: true } : {
      facts: digestPayload.facts, factsDigest: "facts", generatedAt: null,
      suggestions: { motivation: "Start with Tempo run.", suggestions: [] },
    });
    mocks.runCompletionMutation.mockResolvedValue({ ok: true, message: null });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("does not auto-open before onboarding is finished", async () => {
    render(<CheckInOverlay />);
    await waitFor(() => expect(mocks.getJson).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays hidden when check-ins are disabled", async () => {
    mocks.getJson.mockRejectedValue(new Error("digest_disabled"));
    render(<CheckInOverlay />);
    await waitFor(() => expect(mocks.getJson).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not present an invitation already claimed by another device", async () => {
    finishOnboarding();
    mocks.postJson.mockResolvedValue({ claimed: false });
    render(<CheckInOverlay />);
    await waitFor(() => expect(mocks.postJson).toHaveBeenCalledWith("/api/digest/ack", { referenceId: digestPayload.id, localDate: digestPayload.localDate }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens on replay even after the period was acknowledged", async () => {
    finishOnboarding();
    mocks.getJson.mockResolvedValue({
      ...digestPayload,
      acknowledged: true,
      shouldAutoShow: false,
    });
    render(<CheckInOverlay />);
    await waitFor(() => expect(mocks.getJson).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).toBeNull();

    window.dispatchEvent(new Event(DIGEST_OPEN_EVENT));
    expect(
      await screen.findByRole("dialog", { name: /your daily check-in is ready/i })
    ).toBeInTheDocument();
  });

  it("offers a lightweight prompt and waits to generate until it is opened", async () => {
    finishOnboarding();
    const user = userEvent.setup();
    render(<CheckInOverlay />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Your daily check-in is ready")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Recap" })).toBeNull();
    await waitFor(() =>
      expect(mocks.postJson).toHaveBeenCalledWith("/api/digest/ack", {referenceId:digestPayload.id,localDate:digestPayload.localDate})
    );
    expect(mocks.postJson.mock.calls.filter(([path]) => path === "/api/digest/generate")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("tab", { name: "Recap" })).toHaveAttribute(
      "data-state",
      "active"
    );

    await user.click(screen.getByRole("tab", { name: "Next" }));
    expect(await screen.findByText("Start with Tempo run.")).toBeInTheDocument();
    expect(screen.getByText("2 sessions in today, about 1h")).toBeInTheDocument();
    expect(screen.getByText("1 session slipped")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open" })).toBeNull();
  });

  it("recaps only the window that just closed", async () => {
    finishOnboarding();
    const user = userEvent.setup();
    render(<CheckInOverlay />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByText("0 of 1 done")).toBeInTheDocument();
    expect(screen.getByText(/Yesterday · 2026-09-08/)).toBeInTheDocument();
    expect(screen.getByText("Strength")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark done" })).toBeInTheDocument();
    // The window ahead is a decision, not a recap.
    expect(screen.queryByText("Today")).toBeNull();
  });

  it("marks a missed recap item complete without leaving the check-in", async () => {
    finishOnboarding();
    const user = userEvent.setup();
    render(<CheckInOverlay />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open" }));
    mocks.runCompletionMutation.mockImplementationOnce(async () => {
      mocks.getJson.mockResolvedValue({ ...digestPayload, factsDigest: "after-completion", facts: {
        ...digestPayload.facts, recap: { ...digestPayload.facts.recap, completed: 1, items: digestPayload.facts.recap.items.map(item => ({ ...item, state: "completed" })) },
      } });
      return { ok: true, message: null };
    });
    await user.click(screen.getByRole("button", { name: "Mark done" }));

    expect(mocks.runCompletionMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        goalId: "strength",
        date: "2026-09-08",
        desiredFactState: "present",
      })
    );
    expect(await screen.findByText("1 of 1 done")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.postJson.mock.calls.filter(([path]) => path === "/api/digest/generate")).toHaveLength(1);
  });

  it("names the cadence in the prompt", async () => {
    finishOnboarding();
    mocks.getJson.mockResolvedValue({ ...digestPayload, kind: "weekly" });
    render(<CheckInOverlay />);

    expect(
      await screen.findByText("Your weekly check-in is ready")
    ).toBeInTheDocument();
  });

  it("marks the check-in presented before the user opens or skips it", async () => {
    finishOnboarding();
    const user = userEvent.setup();
    render(<CheckInOverlay />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await waitFor(() =>
      expect(mocks.postJson).toHaveBeenCalledWith("/api/digest/ack", {referenceId:digestPayload.id,localDate:digestPayload.localDate})
    );
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(mocks.postJson).toHaveBeenCalledTimes(1);
  });

  it("sends the day's primary button to today", async () => {
    finishOnboarding();
    const user = userEvent.setup();
    render(<CheckInOverlay />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Let’s go" }));

    expect(mocks.push).toHaveBeenCalledWith("/calendar?surface=checklist");
  });



  it("says there is nothing to decide when the window is clear", async () => {
    finishOnboarding();
    const user = userEvent.setup();
    mocks.getJson.mockResolvedValue({
      ...digestPayload,
      facts: {
        ...digestPayload.facts,
        ahead: { ...digestPayload.facts.ahead, placed: 1, completed: 1 },
        recover: { count: 0, items: [] },
      },
    });
    mocks.postJson.mockImplementation(async (path: string) => path === "/api/digest/ack" ? { claimed: true } : {
      facts: { ...digestPayload.facts, ahead: { ...digestPayload.facts.ahead, placed: 1, completed: 1 }, recover: { count: 0, items: [] } },
      factsDigest: "facts", generatedAt: null, suggestions: { motivation: "All clear.", suggestions: [] },
    });
    render(<CheckInOverlay />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("tab", { name: "Next" }));
    expect(
      screen.getByText("Nothing needs a decision right now.")
    ).toBeInTheDocument();
  });
});
