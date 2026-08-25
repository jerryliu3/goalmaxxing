import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JourneyIntroOverlay,
  JOURNEY_INTRO_FORCE_USER_ID_KEY,
  JOURNEY_ONBOARDING_COMPLETED_KEY,
  JOURNEY_INTRO_OPEN_EVENT,
  JOURNEY_INTRO_SEEN_KEY,
} from "@/components/intro/journey-intro-overlay";
import { toLocalDateString } from "@/lib/dates/day";

const routerMock = vi.hoisted(() => ({
  prefetch: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
const getJsonMock = vi.hoisted(() => vi.fn());
const putJsonMock = vi.hoisted(() => vi.fn());
const profileUpdateEqMock = vi.hoisted(() => vi.fn());
const TEST_USER_ID = "user-1";

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/features/planner/calendar-page-shell", () => ({
  CalendarPageShell: () => null,
}));

vi.mock("@/lib/api/client", () => ({
  getJson: (...args: unknown[]) => getJsonMock(...args),
  putJson: (...args: unknown[]) => putJsonMock(...args),
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

vi.mock("@/lib/cache/planner-tab-cache", () => ({
  invalidatePlannerRelatedTabCaches: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { social_activity_visible: true },
              error: null,
            }),
        }),
      }),
      update: () => ({
        eq: (...args: unknown[]) => profileUpdateEqMock(...args),
      }),
    }),
  }),
}));

vi.mock("@/features/settings/planner-preferences-settings", () => ({
  PlannerPreferencesSettings: ({
    value,
  }: {
    value: { timezone: string; weekStartsOn: number };
  }) => (
    <div>
      Timezone {value.timezone}, week starts {value.weekStartsOn}
    </div>
  ),
}));

function mockVisibleOnboardingTargets() {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function mockClientRect(this: HTMLElement) {
      const target = this.getAttribute("data-onboarding") ?? "unknown";
      const index = [
        "nav.insights",
        "nav.calendar",
        "nav.social",
        "nav.settings",
        "nav.new-goal",
      ].indexOf(target);
      const left = 20 + Math.max(index, 0) * 80;
      return {
        top: 12,
        left,
        width: 72,
        height: 40,
        bottom: 52,
        right: left + 72,
        x: left,
        y: 12,
        toJSON: () => ({}),
      } as DOMRect;
    }
  );
}

function renderIntro() {
  return render(
    <>
      <button type="button" data-onboarding="nav.insights">
        Insights
      </button>
      <button type="button" data-onboarding="nav.calendar">
        Planner
      </button>
      <button type="button" data-onboarding="nav.social">
        Community
      </button>
      <button type="button" data-onboarding="nav.settings">
        Profile
      </button>
      <button type="button" data-onboarding="nav.new-goal">
        New Goal +
      </button>
      <JourneyIntroOverlay userId={TEST_USER_ID} />
    </>
  );
}

describe("JourneyIntroOverlay", () => {
  beforeEach(() => {
    window.localStorage.clear();
    getJsonMock.mockResolvedValue({
      preferences: {
        timezone: "UTC",
        defaultPolicy: { weekStartsOn: 1, restWeekdays: [] },
      },
    });
    putJsonMock.mockResolvedValue({});
    profileUpdateEqMock.mockResolvedValue({ error: null });
    mockVisibleOnboardingTargets();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("prefetches calendar when intro opens", async () => {
    renderIntro();
    expect(await screen.findByRole("dialog", { name: "Insights" })).toBeInTheDocument();
    await waitFor(() => {
      expect(routerMock.prefetch).toHaveBeenCalledWith("/calendar");
      expect(routerMock.prefetch).toHaveBeenCalledWith("/calendar?surface=calendar");
    });
  });

  it("shows a spotlight intro without blurring the background", async () => {
    renderIntro();
    const dialog = await screen.findByRole("dialog", { name: "Insights" });
    expect(dialog).not.toHaveClass("backdrop-blur-sm");
    expect(dialog.parentElement).toHaveClass("z-[80]");
    expect(screen.getByTestId("onboarding-highlight")).toBeInTheDocument();
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

    renderIntro();
    expect(await screen.findByRole("dialog", { name: "Insights" })).toBeInTheDocument();
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
    renderIntro();
    expect(screen.queryByRole("dialog", { name: "Insights" })).toBeNull();

    window.dispatchEvent(new Event(JOURNEY_INTRO_OPEN_EVENT));

    expect(await screen.findByRole("dialog", { name: "Insights" })).toBeInTheDocument();
  });

  it("walks through nav highlights and saves preferences on the last step", async () => {
    renderIntro();
    expect(await screen.findByRole("dialog", { name: "Insights" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Planner" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Community" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Profile" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "New Goal +" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByRole("dialog", { name: "Your preferences" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Private/ }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => {
      expect(putJsonMock).toHaveBeenCalled();
      expect(profileUpdateEqMock).toHaveBeenCalled();
      expect(screen.queryByRole("dialog", { name: "Your preferences" })).toBeNull();
    });
    expect(window.localStorage.getItem(JOURNEY_ONBOARDING_COMPLETED_KEY)).toBe("done");
  });

  it("centers the preferences step so actions stay reachable on small screens", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function mockClientRect(this: HTMLElement) {
        const target = this.getAttribute("data-onboarding") ?? "unknown";
        if (target === "nav.settings") {
          return {
            top: 720,
            left: 280,
            width: 72,
            height: 48,
            bottom: 768,
            right: 352,
            x: 280,
            y: 720,
            toJSON: () => ({}),
          } as DOMRect;
        }
        const index = [
          "nav.insights",
          "nav.calendar",
          "nav.social",
          "nav.settings",
          "nav.new-goal",
        ].indexOf(target);
        const left = 20 + Math.max(index, 0) * 80;
        return {
          top: 12,
          left,
          width: 72,
          height: 40,
          bottom: 52,
          right: left + 72,
          x: left,
          y: 12,
          toJSON: () => ({}),
        } as DOMRect;
      }
    );
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });

    renderIntro();
    expect(await screen.findByRole("dialog", { name: "Insights" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Planner" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Community" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Profile" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "New Goal +" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    const preferencesDialog = await screen.findByRole("dialog", {
      name: "Your preferences",
    });
    expect(screen.getByTestId("journey-intro-preferences-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-highlight")).not.toBeInTheDocument();
    expect(preferencesDialog).not.toHaveStyle({ top: "768px" });

    const doneButton = screen.getByRole("button", { name: "Done" });
    expect(doneButton).toBeVisible();
    fireEvent.click(doneButton);
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Your preferences" })).toBeNull();
    });
  });

  it("skips intro without saving preferences", async () => {
    renderIntro();
    expect(await screen.findByRole("dialog", { name: "Insights" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Skip intro" }));
    expect(screen.queryByRole("dialog", { name: "Insights" })).toBeNull();
    expect(putJsonMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(JOURNEY_ONBOARDING_COMPLETED_KEY)).toBe("done");
  });
});
