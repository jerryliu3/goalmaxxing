"use client";

import {
  ArrowLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { SidePanel } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useReportAppSurfaceReady } from "@/components/layout/app-boot-ready";
import { LoadingCard } from "@/components/ui/loading-card";
import { DigestSettings } from "@/features/digest/digest-settings";
import { OnboardingGuidesSettings } from "@/features/onboarding/onboarding-guides-settings";
import { PasswordUpdateForm } from "@/features/auth/password-update-form";
import { AppearanceSettings } from "@/features/settings/appearance-settings";
import { ExternalAppConnections } from "@/features/settings/external-app-connections";
import { PlannerPreferencesSettings, type PlannerPreferencesDraft } from "@/features/settings/planner-preferences-settings";
import { ReportIssueSettings } from "@/features/settings/report-issue-settings";
import {
  getSettingsSectionCopy,
  resolveSettingsSection,
  SETTINGS_GROUPS,
  type SettingsSection,
} from "@/features/settings/settings-section";
import { NotificationsSection } from "@/features/social/notifications-section";
import { buildPublicProfileUrl } from "@/lib/social/public-profile-username";
import { SettingsProfileBox } from "@/features/settings/settings-profile-box";
import { useProfileEditSession } from "@/features/settings/use-profile-edit-session";
import { useOwnProfilePresence } from "@/features/social/use-own-profile-presence";
import { useSocialTabData } from "@/features/social/use-social-tab-data";
import { useClientSearchParamsUpdater } from "@/lib/navigation/use-client-search-params-updater";
import { panelClass } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

type ProfileDraft = {
  username: string;
  display_name: string;
  avatar_url: string;
  social_activity_visible: boolean;
};

export function SettingsTab() {
  const {
    state,
    loading,
    saving,
    signingOut,
    authEmail,
    profileDraft,
    setProfileDraft,
    uploadProfileAvatarFile,
    plannerPreferencesLoading,
    plannerPreferencesDraft,
    setPlannerPreferencesDraft,
    canSaveProfile,
    canSavePreferences,
    saveProfile,
    savePreferences,
    signOut,
  } = useSocialTabData();
  const { bundle: presence, reload: reloadPresence } = useOwnProfilePresence(
    state.userId || null,
    state.profile
  );
  const profileSession = useProfileEditSession({
    bundle: presence,
    identityDraft: profileDraft,
    setIdentityDraft: setProfileDraft,
    authEmail,
    identitySaving: saving,
    canSaveIdentity: canSaveProfile,
    saveIdentity: saveProfile,
    uploadAvatar: uploadProfileAvatarFile,
    reload: reloadPresence,
  });
  useReportAppSurfaceReady(!(loading && !state.userId));
  const searchParams = useSearchParams();
  const { applySearchParams } = useClientSearchParamsUpdater();
  const requestedSection = resolveSettingsSection(searchParams.get("tab"));
  const [cachedSection, setCachedSection] = useState<SettingsSection>("preferences");
  const settingsSection = requestedSection ?? cachedSection;
  const settingsPanelOpen = requestedSection !== null;

  const writeSettingsSection = useCallback(
    (section: SettingsSection | null) => {
      if (section) {
        setCachedSection(section);
      }
      applySearchParams((params) => {
        if (section) {
          params.set("tab", section);
        } else {
          params.delete("tab");
        }
      }, "push");
    },
    [applySearchParams]
  );

  const closeSettingsPanel = useCallback(() => {
    setCachedSection(requestedSection ?? cachedSection);
    writeSettingsSection(null);
  }, [cachedSection, requestedSection, writeSettingsSection]);

  const settingsCopy = getSettingsSectionCopy(settingsSection);

  if (loading && !state.userId) {
    return (
      <LoadingCard
        title="Loading profile…"
        description="Syncing your profile, notifications, and collaboration settings."
      />
    );
  }

  return (
    <div
      data-testid="settings-pane"
      data-settings-pane={settingsPanelOpen ? "open" : "closed"}
      className="min-w-0 space-y-5"
    >
      <header>
        <h1 className="type-title text-2xl">Profile</h1>
        <p className="text-sm text-muted-foreground">How others see you, and how Goalmaxxing works for you.</p>
      </header>
      <SettingsProfileBox bundle={presence} session={profileSession} />
      {SETTINGS_GROUPS.map((group) => (
        <section key={group.key} className="space-y-1">
          <h2 className="type-eyebrow text-[11px] text-muted-foreground">
            {group.label}
          </h2>
          <div className={cn("divide-y overflow-hidden", panelClass)}>
            {group.items.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-label={item.label}
                aria-describedby={`settings-row-${item.key}`}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30",
                  requestedSection === item.key && "bg-muted/40"
                )}
                onClick={() =>
                  writeSettingsSection(
                    requestedSection === item.key ? null : item.key
                  )
                }
              >
                <span className="min-w-0">
                  <span className="block text-base font-medium">{item.label}</span>
                  <span id={`settings-row-${item.key}`} className="block truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
            {group.key === "account" ? (
              <button
                type="button"
                onClick={() => void signOut()}
                disabled={signingOut}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-base font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-60"
              >
                <LogOut aria-hidden className="size-4" />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            ) : null}
          </div>
        </section>
      ))}

      {/* Every width opens a setting in the side panel, wherever the list was scrolled. */}
      <SidePanel
        open={settingsPanelOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeSettingsPanel();
          }
        }}
        title={settingsCopy.label}
        description={settingsCopy.description}
        testId="settings-side-panel"
        header={
          <div className="border-b px-4 pb-3">
            <div className="flex items-center gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeSettingsPanel}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <p className="type-title text-lg tracking-tight">
                {settingsCopy.label}
              </p>
            </div>
            <p className="pt-1 text-sm text-muted-foreground">
              {settingsCopy.description}
            </p>
          </div>
        }
      >
        <SettingsSectionEditor
          settingsSection={settingsSection}
          profileDraft={profileDraft}
          setProfileDraft={setProfileDraft}
          plannerPreferencesDraft={plannerPreferencesDraft}
          setPlannerPreferencesDraft={setPlannerPreferencesDraft}
          plannerPreferencesLoading={plannerPreferencesLoading}
          saving={saving}
          canSavePreferences={canSavePreferences}
          savePreferences={savePreferences}
        />
      </SidePanel>
    </div>
  );
}

function SettingsSectionEditor({
  settingsSection,
  profileDraft,
  setProfileDraft,
  plannerPreferencesDraft,
  setPlannerPreferencesDraft,
  plannerPreferencesLoading,
  saving,
  canSavePreferences,
  savePreferences,
}: {
  settingsSection: SettingsSection;
  profileDraft: ProfileDraft;
  setProfileDraft: Dispatch<SetStateAction<ProfileDraft>>;
  plannerPreferencesDraft: PlannerPreferencesDraft;
  setPlannerPreferencesDraft: Dispatch<SetStateAction<PlannerPreferencesDraft>>;
  plannerPreferencesLoading: boolean;
  saving: boolean;
  canSavePreferences: boolean;
  savePreferences: () => Promise<void>;
}) {
  if (settingsSection === "preferences") {
    return (
      <div className="space-y-4">
        <PlannerPreferencesSettings
          value={plannerPreferencesDraft}
          onChange={(next) => setPlannerPreferencesDraft(next)}
          disabled={plannerPreferencesLoading || saving}
        />
        <div className="space-y-3 border-t pt-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Privacy</p>
            <p className="text-xs text-muted-foreground">
              Control whether your activity appears in feed, leaderboards, and your
              public profile page.
            </p>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={profileDraft.social_activity_visible}
              onChange={(event) =>
                setProfileDraft((prev) => ({
                  ...prev,
                  social_activity_visible: event.target.checked,
                }))
              }
            />
            <span>
              Social activity enabled
              <span className="block text-xs text-muted-foreground">
                Turn off to hide your activity from feed, leaderboards, and your public
                profile URL.
              </span>
            </span>
          </label>
          {profileDraft.username.trim() ? (
            <p className="text-xs text-muted-foreground">
              Public profile:{" "}
              <span className="type-figure text-foreground">
                {buildPublicProfileUrl(profileDraft.username.trim())}
              </span>
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={() => void savePreferences()}
            disabled={saving || plannerPreferencesLoading || !canSavePreferences}
          >
            {saving ? "Saving..." : "Save preferences"}
          </Button>
        </div>
      </div>
    );
  }

  if (settingsSection === "password") {
    return <PasswordUpdateForm requireCurrentPassword />;
  }

  if (settingsSection === "notifications") {
    return <NotificationsSection />;
  }

  if (settingsSection === "onboarding") {
    return <OnboardingGuidesSettings />;
  }

  if (settingsSection === "digest") {
    return <DigestSettings />;
  }

  if (settingsSection === "appearance") {
    return <AppearanceSettings />;
  }

  if (settingsSection === "integrations") {
    return <ExternalAppConnections />;
  }

  return <ReportIssueSettings />;
}
