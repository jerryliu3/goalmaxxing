import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsTab } from "@/features/settings/settings-tab";
import { DEFAULT_PLANNER_PRIMARY_TAB_PREFERENCE } from "@cadence/shared/navigation/tabs";

let mockSearch = "";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
  useSearchParams: () => new URLSearchParams(mockSearch),
  useRouter: () => ({ replace: vi.fn() }),
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
    authEmail: "user@example.com",
    profileDraft: {
      username: "user",
      display_name: "User",
      avatar_url: "",
      planner_primary_tab: DEFAULT_PLANNER_PRIMARY_TAB_PREFERENCE,
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

vi.mock("@/features/social/profile-section", () => ({
  ProfileSection: () => <div>Profile</div>,
}));

vi.mock("@/features/social/notifications-section", () => ({
  NotificationsSection: () => <div>Notifications body</div>,
}));

vi.mock("@/features/settings/integrations-settings", () => ({
  IntegrationsSettings: () => <div>Integrations body</div>,
}));

vi.mock("@/features/settings/planner-preferences-settings", () => ({
  PlannerPreferencesSettings: () => <div>Preferences body</div>,
}));

vi.mock("@/features/settings/report-issue-settings", () => ({
  ReportIssueSettings: () => <div>Report issue body</div>,
}));

vi.mock("@/features/onboarding/onboarding-guides-settings", () => ({
  OnboardingGuidesSettings: () => <div>Onboarding guides body</div>,
}));

vi.mock("@/components/intro/journey-intro-overlay", () => ({
  requestJourneyIntroOpen: vi.fn(),
}));

describe("SettingsTab", () => {
  afterEach(() => {
    cleanup();
    mockSearch = "";
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
});
