import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/app-shell";

let mockPathname = "/";
let mockSearch = "";

const cacheScopeMock = vi.hoisted(() => ({
  setScope: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

vi.mock("@/components/navigation/tab-nav", () => ({
  TabNav: ({ mobile = false }: { mobile?: boolean }) => (
    <nav data-testid={mobile ? "tab-nav-mobile" : "tab-nav-desktop"} />
  ),
}));

vi.mock("@/components/xp/xp-level-badge", () => ({
  XpLevelBadge: () => <span>XP Badge</span>,
}));

vi.mock("@/components/xp/xp-progress-bar", () => ({
  XpProgressBar: () => <span>XP Progress</span>,
}));

vi.mock("@/components/xp/altitude-backdrop", () => ({
  AltitudeBackdrop: () => <div data-testid="altitude-backdrop" />,
}));

vi.mock("@/components/xp/xp-profile-provider", () => ({
  XpProfileProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/intro/journey-intro-overlay", () => ({
  JourneyIntroOverlay: () => <div data-testid="journey-intro-overlay" />,
}));
vi.mock("@/components/layout/app-boot-splash", () => ({
  AppBootSplash: () => null,
}));
vi.mock("@/features/digest/check-in-overlay", () => ({
  CheckInOverlay: () => <div data-testid="check-in-overlay" />,
}));
vi.mock("@/lib/cache/tab-data-cache", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/cache/tab-data-cache")>(),
  setTabDataCacheScope: (scope: string) => cacheScopeMock.setScope(scope),
}));
vi.mock("@/lib/cache/use-idle-app-prefetch", () => ({
  useIdleAppPrefetch: () => undefined,
}));

const emptyDuoProps = {
  duoState: {
    activePartner: null,
    pendingInvite: null,
  },
  duoAvailability: "ready" as const,
  initialDuoScopePreference: null,
  journeyFlags: {
    journeyEnabled: false,
  },
} as const;

describe("AppShell", () => {
  afterEach(() => {
    cleanup();
    cacheScopeMock.setScope.mockReset();
    mockPathname = "/";
    mockSearch = "";
  });

  it("renders the `New Goal +` header link", () => {
    render(
      <AppShell userId="user-1" {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );

    const newGoalLink = screen.getAllByRole("link", { name: /new goal \+/i })[0];
    expect(newGoalLink).toHaveAttribute("href", "/goals/new?returnTo=%2F");
    expect(newGoalLink).toHaveAttribute("data-onboarding", "nav.new-goal");
    expect(newGoalLink).toHaveClass("h-8");
    expect(newGoalLink).toHaveClass("bg-primary");
    expect(screen.getByText("Goalmaxxing").parentElement).toContainElement(
      screen.getByText("XP Progress")
    );
  });

  it("hides the XP bar when XP is disabled", () => {
    render(
      <AppShell userId="user-1" xpEnabled={false} {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );

    expect(screen.queryByText("XP Progress")).not.toBeInTheDocument();
  });

  it("includes the current route in the new goal returnTo query", () => {
    mockPathname = "/social";
    mockSearch = "tab=challenges&sort=recent";

    render(
      <AppShell userId="user-1" {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );

    const newGoalLink = screen.getAllByRole("link", { name: /new goal \+/i })[0];
    expect(newGoalLink).toHaveAttribute(
      "href",
      "/goals/new?returnTo=%2Fsocial%3Ftab%3Dchallenges%26sort%3Drecent"
    );
  });

  it("prefixes the new goal href when a demo base path is provided", () => {
    mockPathname = "/demo/calendar";
    render(
      <AppShell userId="user-1" hrefPrefix="/demo" {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );

    expect(screen.getAllByRole("link", { name: /new goal \+/i })[0]).toHaveAttribute(
      "href",
      "/demo/goals/new?returnTo=%2Fdemo%2Fcalendar"
    );
  });

  it("hides the journey intro when asked", () => {
    render(
      <AppShell userId="user-1" showJourneyIntro={false} {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );

    expect(screen.queryByTestId("journey-intro-overlay")).not.toBeInTheDocument();
  });

  it("mounts the check-in overlay only when the flag is on", () => {
    const { rerender } = render(
      <AppShell userId="user-1" {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );
    expect(screen.queryByTestId("check-in-overlay")).not.toBeInTheDocument();

    rerender(
      <AppShell userId="user-1" digestEnabled {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );
    expect(screen.getByTestId("check-in-overlay")).toBeInTheDocument();
  });

  it("scopes tab data cache by authenticated user", () => {
    render(
      <AppShell userId="user-1" {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );

    expect(cacheScopeMock.setScope).toHaveBeenCalledWith("user-1");
  });

  it("renders route children", () => {
    render(
      <AppShell userId="user-1" {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders Goalmaxxing without a destination kicker", () => {
    mockPathname = "/insights";
    render(
      <AppShell userId="user-1" {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );

    expect(screen.queryByText("Progress")).not.toBeInTheDocument();
    expect(screen.getByText("Goalmaxxing")).toBeInTheDocument();
    expect(screen.getByText("Goalmaxxing")).toHaveClass("text-xl");
    expect(screen.getByText("XP Progress")).toBeInTheDocument();
  });

  it("does not force Gazetteer onto the authenticated shell", () => {
    render(
      <AppShell userId="user-1" {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );

    expect(document.querySelector(".gm-gazetteer")).not.toBeInTheDocument();
  });

  it("keeps the mobile tab bar out of the page view-transition snapshot", () => {
    render(
      <AppShell userId="user-1" {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );

    expect(screen.getByTestId("tab-nav-mobile").parentElement).toHaveStyle({
      viewTransitionName: "app-mobile-tab-nav",
    });
  });
});
