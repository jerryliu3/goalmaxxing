import { useCallback, useState } from "react";
import { PageOnboardingReadyContext } from "@/features/onboarding/onboarding-readiness";
import { TabOnboardingOverlay } from "@/features/onboarding/tab-onboarding-overlay";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JourneyIntroOverlay,
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
const profileUpdateMock = vi.hoisted(() => vi.fn());
const profileUpdateEqMock = vi.hoisted(() => vi.fn());
const TEST_USER_ID = "user-1";
const INTRO_WALKTHROUGH_TIMEOUT_MS = 20_000;

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
      update: (values: unknown) => {
        profileUpdateMock(values);
        return {
          eq: (...args: unknown[]) => profileUpdateEqMock(...args),
        };
      },
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
        "nav.calendar",
        "nav.goals",
        "nav.social",
        "nav.settings",
        "nav.growth",
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

function renderIntro(
  onOpenChange?: (open: boolean) => void,
  preferencesRequired = false
) {
  return render(
    <>
      <button type="button" data-onboarding="nav.calendar">
        Plan
      </button>
      <button type="button" data-onboarding="nav.goals">
        Progress
      </button>
      <button type="button" data-onboarding="nav.social">
        Community
      </button>
      <button type="button" data-onboarding="nav.settings">
        Profile
      </button>
      <button type="button" data-onboarding="nav.growth">
        New Goal +
      </button>
      <JourneyIntroOverlay
        userId={TEST_USER_ID}
        preferencesRequired={preferencesRequired}
        onOpenChange={onOpenChange}
      />
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

  it("waits for boot, then shows the navigation intro before the page guide", async () => {
    function Guides() {
      const [bootReady, setBootReady] = useState(false);
      const [introReady, setIntroReady] = useState(false);
      const onOpenChange = useCallback((open: boolean) => setIntroReady(!open), []);
      return (
        <PageOnboardingReadyContext.Provider value={bootReady && introReady}>
          <button onClick={() => setBootReady(true)}>Finish loading</button>
          <div data-onboarding="nav.calendar">Navigation</div>
          <div data-onboarding="planner.calendar.controls">Page controls</div>
          <JourneyIntroOverlay
            userId={TEST_USER_ID}
            enabled={bootReady}
            onOpenChange={onOpenChange}
          />
          <TabOnboardingOverlay onboardingKey="planner.calendar" forceOpen />
        </PageOnboardingReadyContext.Provider>
      );
    }
    render(<Guides />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(routerMock.prefetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Finish loading" }));
    expect(await screen.findByRole("dialog", { name: "Agenda" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Agenda views" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(await screen.findByRole("dialog", { name: "Agenda views" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Agenda" })).toBeNull();
  });

  it("waits for boot before opening required preferences", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <JourneyIntroOverlay
        userId={TEST_USER_ID}
        enabled={false}
        preferencesRequired
        onOpenChange={onOpenChange}
      />
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    rerender(
      <JourneyIntroOverlay
        userId={TEST_USER_ID}
        enabled
        preferencesRequired
        onOpenChange={onOpenChange}
      />
    );
    expect(
      await screen.findByRole("dialog", { name: "Your preferences" })
    ).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("releases page guides for users who already completed the intro", async () => {
    const onOpenChange = vi.fn();
    window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
    render(<JourneyIntroOverlay userId={TEST_USER_ID} onOpenChange={onOpenChange} />);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("prefetches calendar when intro opens", async () => {
    renderIntro();
    expect(await screen.findByRole("dialog", { name: "Agenda" })).toBeInTheDocument();
    await waitFor(() => {
      expect(routerMock.prefetch).toHaveBeenCalledWith("/calendar");
      expect(routerMock.prefetch).toHaveBeenCalledWith("/calendar?view=day");
    });
  });

  it("shows a spotlight intro without blurring the background", async () => {
    renderIntro();
    const dialog = await screen.findByRole("dialog", { name: "Agenda" });
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

  it("requires preferences even when this browser already finished the tour", async () => {
    window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
    window.localStorage.setItem(JOURNEY_INTRO_SEEN_KEY, toLocalDateString());
    renderIntro(undefined, true);

    expect(
      await screen.findByRole("dialog", { name: "Your preferences" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip tour" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("reopens intro on preferences when settings triggers the revisit event", async () => {
    window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
    const onOpenChange = vi.fn();
    renderIntro(onOpenChange);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(screen.queryByRole("dialog")).toBeNull();

    act(() => window.dispatchEvent(new Event(JOURNEY_INTRO_OPEN_EVENT)));

    expect(
      await screen.findByRole("dialog", { name: "Your preferences" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip tour" })).toBeInTheDocument();
  });

  it(
    "saves required preferences on Next, then walks the skippable tour",
    async () => {
      const onOpenChange = vi.fn();
      renderIntro(onOpenChange, true);

      expect(
        await screen.findByRole("dialog", { name: "Your preferences" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Public/ })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
      });
      fireEvent.click(screen.getByRole("button", { name: /Private/ }));
      expect(screen.getByRole("button", { name: /Private/ })).toHaveAttribute(
        "aria-pressed",
        "true"
      );

      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(await screen.findByRole("dialog", { name: "Agenda" })).toBeInTheDocument();
      expect(putJsonMock).toHaveBeenCalledWith(
        "/api/planner/context",
        expect.objectContaining({ timezone: "UTC" })
      );
      expect(profileUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          social_activity_visible: false,
          onboarding_completed_at: expect.any(String),
        })
      );
      expect(screen.getByRole("button", { name: "Skip tour" })).toBeInTheDocument();

      for (const title of ["Goals", "Growth", "Community", "Profile"]) {
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(await screen.findByRole("dialog", { name: title })).toBeInTheDocument();
      }
      fireEvent.click(screen.getByRole("button", { name: "Done" }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
        expect(screen.queryByRole("dialog")).toBeNull();
      });
      expect(putJsonMock).toHaveBeenCalledTimes(1);
      expect(window.localStorage.getItem(JOURNEY_ONBOARDING_COMPLETED_KEY)).toBe("done");
    },
    INTRO_WALKTHROUGH_TIMEOUT_MS
  );

  it("keeps required preferences open when the save fails", async () => {
    putJsonMock.mockRejectedValueOnce(new Error("offline"));
    renderIntro(undefined, true);

    expect(
      await screen.findByRole("dialog", { name: "Your preferences" })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => expect(putJsonMock).toHaveBeenCalled());
    expect(screen.getByRole("dialog", { name: "Your preferences" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip tour" })).toBeNull();
  });

  it("centers the preferences step so actions stay reachable on small screens", async () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });

    renderIntro(undefined, true);

    const preferencesDialog = await screen.findByRole("dialog", {
      name: "Your preferences",
    });
    expect(screen.getByTestId("journey-intro-preferences-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-highlight")).not.toBeInTheDocument();
    expect(preferencesDialog).not.toHaveStyle({ top: "768px" });
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible();
  });

  it("starts the tour after preferences for users who already saved them", async () => {
    renderIntro();
    expect(await screen.findByRole("dialog", { name: "Agenda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("skips the tour without saving preferences", async () => {
    renderIntro();
    expect(await screen.findByRole("dialog", { name: "Agenda" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(screen.queryByRole("dialog", { name: "Agenda" })).toBeNull();
    expect(putJsonMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(JOURNEY_ONBOARDING_COMPLETED_KEY)).toBe("done");
  });
});
