import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JOURNEY_INTRO_SEEN_KEY,
  JOURNEY_ONBOARDING_COMPLETED_KEY,
} from "@/components/intro/journey-intro-overlay";
import { CheckInOverlay } from "@/features/digest/check-in-overlay";
import { DIGEST_OPEN_EVENT } from "@/features/digest/digest-api";
import { COACH_PROMPT_SEED_KEY } from "@/lib/coach/coach-prompt-seed";

const mocks = vi.hoisted(() => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/lib/api/client", () => ({
  getJson: mocks.getJson,
  postJson: mocks.postJson,
  getApiErrorMessage: () => "error",
}));

const digestPayload = {
  schemaVersion: "1" as const,
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
      items: [{ title: "Strength", date: "2026-09-08", state: "open" as const }],
    },
    ahead: {
      label: "Today",
      start: "2026-09-09",
      end: "2026-09-09",
      placed: 2,
      completed: 0,
      estimatedMinutes: 60,
      items: [{ title: "Tempo run", date: "2026-09-09", state: "open" as const }],
    },
    recover: {
      count: 1,
      items: [{ title: "Strength", date: "2026-09-08", state: "open" as const }],
    },
    unscheduled: { count: 0, titles: [] },
  },
  suggestions: null,
};

function finishOnboarding() {
  window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
  window.localStorage.setItem(JOURNEY_INTRO_SEEN_KEY, "2026-01-01");
}

describe("CheckInOverlay", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    mocks.getJson.mockResolvedValue(digestPayload);
    mocks.postJson.mockResolvedValue({
      suggestions: {
        motivation: "Start with Tempo run.",
        suggestions: [],
      },
    });
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
      expect(mocks.postJson).toHaveBeenCalledWith("/api/digest/ack", {})
    );
    expect(mocks.postJson).not.toHaveBeenCalledWith("/api/digest/generate", {});

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("tab", { name: "Recap" })).toHaveAttribute(
      "data-state",
      "active"
    );

    await user.click(screen.getByRole("tab", { name: "Decisions" }));
    expect(screen.getByText("2 sessions in today, about 1h")).toBeInTheDocument();
    expect(screen.getByText("Recover 1 missed session")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Coach" }));
    expect(await screen.findByText("Start with Tempo run.")).toBeInTheDocument();
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
    expect(screen.getByText("Missed")).toBeInTheDocument();
    // The window ahead is a decision, not a recap.
    expect(screen.queryByText("Today")).toBeNull();
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
      expect(mocks.postJson).toHaveBeenCalledWith("/api/digest/ack", {})
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

  it("stashes a coach question and heads for the plan on Ask coach", async () => {
    finishOnboarding();
    const user = userEvent.setup();
    render(<CheckInOverlay />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Ask coach" }));

    expect(window.sessionStorage.getItem(COACH_PROMPT_SEED_KEY)).toContain(
      "daily check-in"
    );
    expect(mocks.push).toHaveBeenCalledWith("/calendar?surface=calendar");
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
    mocks.postJson.mockResolvedValue({
      suggestions: { motivation: "All clear.", suggestions: [] },
    });
    render(<CheckInOverlay />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("tab", { name: "Decisions" }));
    expect(
      screen.getByText("Nothing needs a decision right now.")
    ).toBeInTheDocument();
  });
});
