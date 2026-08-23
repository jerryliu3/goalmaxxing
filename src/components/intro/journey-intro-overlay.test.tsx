import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JourneyIntroOverlay,
  JOURNEY_INTRO_FORCE_USER_ID_KEY,
  JOURNEY_ONBOARDING_COMPLETED_KEY,
  JOURNEY_INTRO_OPEN_EVENT,
  JOURNEY_INTRO_SEEN_KEY,
} from "@/components/intro/journey-intro-overlay";
import { toLocalDateString } from "@/lib/dates/day";

const useXpProfileMock = vi.hoisted(() => vi.fn());
const routerMock = vi.hoisted(() => ({
  prefetch: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
const TEST_USER_ID = "user-1";

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/components/xp/xp-profile-provider", () => ({
  useXpProfile: () => useXpProfileMock(),
}));

describe("JourneyIntroOverlay", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useXpProfileMock.mockReturnValue({
      band: { name: "Trailhead" },
      profile: { currentLevel: 1, totalXp: 0 },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("prefetches calendar when intro opens", async () => {
    render(<JourneyIntroOverlay userId={TEST_USER_ID} />);
    expect(await screen.findByRole("dialog", { name: "Welcome to Goalmaxxing" })).toBeInTheDocument();
    expect(routerMock.prefetch).toHaveBeenCalledWith("/calendar");
    expect(routerMock.prefetch).toHaveBeenCalledWith("/calendar?surface=calendar");
  });

  it("shows intro when unseen", async () => {
    render(<JourneyIntroOverlay userId={TEST_USER_ID} />);
    expect(await screen.findByRole("dialog", { name: "Welcome to Goalmaxxing" })).toBeInTheDocument();
  });

  it("keeps the intro modal vertically centered", async () => {
    render(<JourneyIntroOverlay userId={TEST_USER_ID} />);
    const overlay = await screen.findByRole("dialog", {
      name: "Welcome to Goalmaxxing",
    });
    expect(overlay).toHaveClass("items-center");
    expect(overlay).not.toHaveClass("items-end");
  });

  it("stays hidden once onboarding is completed", () => {
    window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
    const { container } = render(<JourneyIntroOverlay userId={TEST_USER_ID} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden for existing users who already saw legacy intro", () => {
    window.localStorage.setItem(JOURNEY_INTRO_SEEN_KEY, toLocalDateString());
    const { container } = render(<JourneyIntroOverlay userId={TEST_USER_ID} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens once when signup forces intro for this user", async () => {
    window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
    window.localStorage.setItem(JOURNEY_INTRO_SEEN_KEY, toLocalDateString());
    window.localStorage.setItem(JOURNEY_INTRO_FORCE_USER_ID_KEY, TEST_USER_ID);

    render(<JourneyIntroOverlay userId={TEST_USER_ID} />);
    expect(await screen.findByRole("dialog", { name: "Welcome to Goalmaxxing" })).toBeInTheDocument();
    expect(window.localStorage.getItem(JOURNEY_INTRO_FORCE_USER_ID_KEY)).toBeNull();
  });

  it("does not force intro for a different user", () => {
    window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
    window.localStorage.setItem(JOURNEY_INTRO_SEEN_KEY, toLocalDateString());
    window.localStorage.setItem(JOURNEY_INTRO_FORCE_USER_ID_KEY, "other-user");

    const { container } = render(<JourneyIntroOverlay userId={TEST_USER_ID} />);
    expect(container).toBeEmptyDOMElement();
    expect(window.localStorage.getItem(JOURNEY_INTRO_FORCE_USER_ID_KEY)).toBe("other-user");
  });

  it("reopens intro when settings triggers the revisit event", async () => {
    window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
    render(<JourneyIntroOverlay userId={TEST_USER_ID} />);
    expect(screen.queryByRole("dialog", { name: "Welcome to Goalmaxxing" })).toBeNull();

    window.dispatchEvent(new Event(JOURNEY_INTRO_OPEN_EVENT));

    expect(
      await screen.findByRole("dialog", { name: "Welcome to Goalmaxxing" })
    ).toBeInTheDocument();
  });

  it("advances through steps, persists completion, and stays on the current tab", async () => {
    render(<JourneyIntroOverlay userId={TEST_USER_ID} />);
    expect(await screen.findByRole("dialog", { name: "Welcome to Goalmaxxing" })).toBeInTheDocument();
    expect(
      screen.getByText(/Goalmaxxing helps you set short-term and long-term goals/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      await screen.findByRole("dialog", { name: "Create different types of goals" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      await screen.findByRole("dialog", { name: "Plan and execute" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Use Calendar to plan individual sessions across the coming days\/weeks\/months/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Stay accountable" })).toBeInTheDocument();
    expect(
      screen.getByText(/Check the Community tab to interact with others/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Your goals are ready" })).toBeInTheDocument();
    expect(
      screen.getByText(/We've added some initial goals to get you familiar/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Every check-in moves you upward. Your current camp is/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Trailhead")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog", { name: "Your goals are ready" })).toBeNull();
    expect(window.localStorage.getItem(JOURNEY_ONBOARDING_COMPLETED_KEY)).toBe("done");
  });
});
