import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsTab } from "@/features/settings/settings-tab";

let mockSearch = "";
let mockVisibility: "public" | "private" = "public";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
  useSearchParams: () => new URLSearchParams(mockSearch),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/features/social/use-own-profile-presence", () => ({
  useOwnProfilePresence: () => ({
    bundle: {
      schemaVersion: "1",
      profile: { subjectUserId: "user-1", username: "user", displayName: "User", avatarUrl: null, isPrivate: false, visibility: mockVisibility, createdAt: null, memberNumber: null },
      xp: null,
      globalAchievements: [],
      awardCatalogCount: 0,
      overallStats: { totalActivities: 9, totalGoalsCompleted: 1, todayActivities: 0, activeStreakWeeks: 2, currentWeekActivities: { current: 0, previous: 0, delta: 0, deltaPercent: null }, currentMonthActivities: { current: 0, previous: 0, delta: 0, deltaPercent: null } },
      growSeries: [],
      yearHeatmap: [],
      currentGoals: [],
      bio: "Training for a spring half.",
      showcase: [],
      showcaseCatalog: { medals: [], goals: [], records: [] },
    },
    loading: false,
    reload: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc: vi.fn() }),
}));

vi.mock("@/features/social/use-social-tab-data", () => ({
  useSocialTabData: () => ({
    state: {
      userId: "user-1",
      profile: null,
      ownGoals: [],
    },
    loading: false,
    saving: false,
    signingOut: false,
    profileDraft: {
      username: "user",
      display_name: "User",
      avatar_url: "",
      social_activity_visible: true,
    },
    setProfileDraft: vi.fn(),
    uploadProfileAvatarFile: vi.fn(),
    plannerPreferencesLoading: false,
    plannerPreferencesDraft: {
      timezone: "UTC",
      weekStartsOn: 1,
      restWeekdays: [],
    },
    setPlannerPreferencesDraft: vi.fn(),
    canSaveProfile: false,
    canSavePreferences: false,
    saveProfile: vi.fn(),
    savePreferences: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@/features/social/profile-membership-card", () => ({
  ProfileMembershipCard: ({ profile, bio }: { profile: { visibility?: string }; bio?: string }) => <div data-testid="profile-card" data-visibility={profile.visibility}>Profile card<p>{bio}</p></div>,
}));

vi.mock("@/features/social/notifications-section", () => ({
  NotificationsSection: () => <div>Notifications body</div>,
}));

vi.mock("@/features/settings/planner-preferences-settings", () => ({
  PlannerPreferencesSettings: () => <div>Preferences body</div>,
}));

vi.mock("@/features/auth/password-update-form", () => ({
  PasswordUpdateForm: ({ requireCurrentPassword }: { requireCurrentPassword?: boolean }) => <div>{requireCurrentPassword ? "Change password body" : "Reset password body"}</div>,
}));

vi.mock("@/features/settings/appearance-settings", () => ({
  AppearanceSettings: () => <div>Appearance body</div>,
}));

vi.mock("@/features/settings/report-issue-settings", () => ({
  ReportIssueSettings: () => <div>Report issue body</div>,
}));

vi.mock("@/features/onboarding/onboarding-guides-settings", () => ({
  OnboardingGuidesSettings: () => <div>Onboarding guides body</div>,
}));

vi.mock("@/features/digest/digest-settings", () => ({
  DigestSettings: () => <div>Check-in body</div>,
}));

vi.mock("@/components/intro/journey-intro-overlay", () => ({
  requestJourneyIntroOpen: vi.fn(),
}));

describe("SettingsTab", () => {
  it("shows the saved private appearance at rest and while editing", async () => {
    mockVisibility = "private";
    const user = userEvent.setup();
    const { rerender } = render(<SettingsTab />);
    expect(screen.getByRole("heading", { name: "Private profile" })).toBeInTheDocument();
    expect(screen.getByTestId("profile-card")).toHaveAttribute("data-visibility", "private");
    await user.click(screen.getByRole("button", { name: /Edit profile/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Your profile stays private");
    expect(screen.getByTestId("profile-card")).toHaveAttribute("data-visibility", "private");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    mockVisibility = "public";
    rerender(<SettingsTab />);
    expect(screen.getByRole("heading", { name: "Public profile" })).toBeInTheDocument();
    expect(screen.getByTestId("profile-card")).toHaveAttribute("data-visibility", "public");
  });

  it("opens with the public profile and keeps score, stats and heatmap off Settings", () => {
    render(<SettingsTab />);
    const box = screen.getByRole("region", { name: "Your Goalmaxxing profile" });
    expect(box).toHaveTextContent("Profile card");
    expect(box).toHaveTextContent("Training for a spring half.");
    expect(screen.getByRole("button", { name: /Edit profile/ })).toBeInTheDocument();
    expect(screen.queryByText("activities")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Goal score" })).toBeNull();
    expect(screen.queryByText("Overall stats")).toBeNull();
  });

  it("edits the profile in place with Cancel and Done", async () => {
    const user = userEvent.setup();
    render(<SettingsTab />);

    await user.click(screen.getByRole("button", { name: /Edit profile/ }));
    expect(
      screen.getByText("Editing — changes are visible to everyone when you press Done")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "Add a pin" })).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: /Edit profile/ })).toBeInTheDocument();
  });
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    cleanup();
    mockSearch = "";
    mockVisibility = "public";
    window.matchMedia = originalMatchMedia;
  });

  it("opens the change-password form from Account", () => {
    mockSearch = "tab=password";
    render(<SettingsTab />);
    expect(screen.getByText("Change password body")).toBeTruthy();
  });

  it("writes an opened settings panel into the tab query", async () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const user = userEvent.setup();
    render(<SettingsTab />);

    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(pushStateSpy.mock.calls.at(-1)?.[2]).toBe(
      "/settings?tab=notifications"
    );
  });

  it("clears the tab query when the settings panel closes", async () => {
    mockSearch = "tab=notifications";
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const user = userEvent.setup();
    render(<SettingsTab />);

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(pushStateSpy.mock.calls.at(-1)?.[2]).toBe("/settings");
  });

  it("opens the settings panel from the query string on refresh", () => {
    mockSearch = "tab=integrations";
    render(<SettingsTab />);

    expect(screen.getByRole("dialog", { name: "Integrations" })).toBeInTheDocument();
  });

  it("opens appearance from the tab query", () => {
    mockSearch = "tab=appearance";
    render(<SettingsTab />);

    expect(screen.getByRole("dialog", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByTestId("settings-side-panel")).toHaveClass("rounded-none");
    expect(screen.getByText("Appearance body")).toBeInTheDocument();
  });

  it("opens digest settings from the tab query", () => {
    mockSearch = "tab=digest";
    render(<SettingsTab />);

    expect(screen.getByRole("dialog", { name: "Check-in" })).toBeInTheDocument();
    expect(screen.getByText("Check-in body")).toBeInTheDocument();
  });

  it("opens onboarding guides from the tab query", () => {
    mockSearch = "tab=onboarding";
    render(<SettingsTab />);

    expect(
      screen.getByRole("dialog", { name: "Onboarding guides" })
    ).toBeInTheDocument();
    expect(screen.getByText("Onboarding guides body")).toBeInTheDocument();
  });

  it("keeps the panel closed for unknown tab values", () => {
    mockSearch = "tab=profile";
    render(<SettingsTab />);

    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(
      screen.queryByRole("dialog", { name: "Preferences" })
    ).toBeNull();
  });

  it("groups existing controls into Plan, Connected, and Account", () => {
    render(<SettingsTab />);

    expect(screen.getByText("Profile card")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Connected" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preferences" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByText("Primary planner tab")).not.toBeInTheDocument();
    // Each group sits on a raised panel, like the other cards on the page.
    expect(screen.getByRole("button", { name: "Preferences" }).parentElement).toHaveClass("bg-card", "rounded-2xl");
  });

  it("says what each setting holds without a page title", () => {
    render(<SettingsTab />);

    expect(screen.queryByRole("heading", { level: 1, name: "Profile" })).not.toBeInTheDocument();
    expect(screen.queryByText("How others see you, and how Goalmaxxing works for you.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preferences" })).toHaveAccessibleDescription(
      "Timezone, first day of the week, and activity privacy."
    );
  });

  it("opens settings in the side panel on desktop too, wherever the list sits", async () => {
    window.matchMedia = ((query: string) =>
      ({
        matches: query.includes("min-width: 768px"),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      })) as typeof window.matchMedia;
    mockSearch = "tab=notifications";
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const user = userEvent.setup();
    render(<SettingsTab />);

    expect(screen.getByTestId("settings-pane")).toHaveAttribute("data-settings-pane", "open");
    expect(screen.queryByTestId("settings-desktop-editor")).toBeNull();
    expect(screen.getByTestId("settings-side-panel")).toHaveTextContent("Notifications body");

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(pushStateSpy.mock.calls.at(-1)?.[2]).toBe("/settings");
  });
});
