import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/app-shell";

let mockPathname = "/";
let mockSearch = "";

const cacheScopeMock = vi.hoisted(() => ({
  setScope: vi.fn(),
}));

const routerMock = vi.hoisted(() => ({
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
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

function openAccountMenu() {
  const trigger = screen.getByRole("button", { name: /Account menu/ });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "Enter" });
  return trigger;
}

describe("AppShell", () => {
  afterEach(() => {
    cleanup();
    cacheScopeMock.setScope.mockReset();
    mockPathname = "/";
    mockSearch = "";
  });

  it("keeps profile in the header account menu and creation off Agenda", () => {
    mockPathname = "/calendar";
    render(<AppShell userId="user-1" {...emptyDuoProps}><div>Child content</div></AppShell>);
    openAccountMenu();
    expect(screen.getByRole("menuitem", { name: "Profile settings" })).toHaveAttribute("href", "/settings");
    expect(screen.queryByRole("link", { name: /new goal/i })).toBeNull();
  });
  it("hides the XP bar when XP is disabled", () => {
    render(
      <AppShell userId="user-1" xpEnabled={false} {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );

    expect(screen.queryByText("XP Progress")).not.toBeInTheDocument();
  });

  it("keeps demo profile chrome independent of external avatar requests", () => {
    render(<AppShell userId="demo-user" hrefPrefix="/demo" viewerAvatarUrl="https://randomuser.me/api/portraits/men/32.jpg" {...emptyDuoProps}>Demo</AppShell>);
    const trigger = openAccountMenu();
    expect(trigger.querySelector("img")).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Profile settings" })).toHaveAttribute("href", "/demo/settings");
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

  it("leads the header with XP, without an app title or destination kicker", () => {
    mockPathname = "/insights";
    render(
      <AppShell userId="user-1" {...emptyDuoProps}>
        <div>Child content</div>
      </AppShell>
    );

    expect(screen.queryByText("Progress")).not.toBeInTheDocument();
    expect(screen.queryByText("Goalmaxxing")).not.toBeInTheDocument();
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
