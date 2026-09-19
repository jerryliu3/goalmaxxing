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
import { AppearanceSettings } from "@/features/settings/appearance-settings";
import { IntegrationsSettings } from "@/features/settings/integrations-settings";
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
import { ProfilePresenceSection } from "@/features/social/profile-presence";
import { ProfileSection } from "@/features/social/profile-section";
import { useOwnProfilePresence } from "@/features/social/use-own-profile-presence";
import { useSocialTabData } from "@/features/social/use-social-tab-data";
import { useClientSearchParamsUpdater } from "@/lib/navigation/use-client-search-params-updater";
import { useMediaQuery } from "@/lib/ui/use-media-query";
import { cn } from "@/lib/utils";
import type { Goal } from "@/lib/goals/types";

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
  const { bundle: presence } = useOwnProfilePresence(state.userId || null);
  useReportAppSurfaceReady(!(loading && !state.userId));
  const searchParams = useSearchParams();
  const { applySearchParams } = useClientSearchParamsUpdater();
  const isDesktopTwoPane = useMediaQuery("(min-width: 768px)");
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

  const editor = (
    <SettingsSectionEditor
      settingsSection={settingsSection}
      ownGoals={state.ownGoals}
      profileDraft={profileDraft}
      setProfileDraft={setProfileDraft}
      plannerPreferencesDraft={plannerPreferencesDraft}
      setPlannerPreferencesDraft={setPlannerPreferencesDraft}
      plannerPreferencesLoading={plannerPreferencesLoading}
      saving={saving}
      canSavePreferences={canSavePreferences}
      savePreferences={savePreferences}
    />
  );

  const groups = (
    <div className="space-y-5">
      {SETTINGS_GROUPS.map((group) => (
        <section key={group.key} className="space-y-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {group.label}
          </h2>
          <div className="divide-y border-y">
            {group.items.map((item) => (
              <button
                key={item.key}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between py-3 text-left text-base font-medium transition-colors hover:bg-muted/30",
                  requestedSection === item.key && "bg-muted/40"
                )}
                onClick={() =>
                  writeSettingsSection(
                    requestedSection === item.key ? null : item.key
                  )
                }
              >
                <span>{item.label}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
            {group.key === "account" ? (
              <div className="py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void signOut()}
                  disabled={signingOut}
                >
                  <LogOut className="size-4" />
                  {signingOut ? "Signing out..." : "Sign out"}
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <div
      data-testid="settings-pane"
      data-settings-pane={settingsPanelOpen ? "open" : "closed"}
      className="md:flex md:items-start md:overflow-hidden"
    >
      <div className="min-w-0 flex-1 space-y-5">
        <ProfileSection
          userId={state.userId}
          profile={state.profile}
          profileDraft={profileDraft}
          authEmail={authEmail}
          saving={saving}
          canSaveProfile={canSaveProfile}
          setProfileDraft={setProfileDraft}
          onSaveProfile={saveProfile}
          onUploadAvatar={uploadProfileAvatarFile}
        />
        {presence ? (
          <ProfilePresenceSection
            growSeries={presence.growSeries}
            heatmap={presence.yearHeatmap}
            selectedYear={new Date().getFullYear()}
          />
        ) : null}
        {groups}
      </div>

      {isDesktopTwoPane ? (
        <div
          className={cn(
            "min-w-0 overflow-hidden md:transition-[width] md:duration-[var(--motion-duration-hold)] md:ease-[var(--motion-ease-emphasized)] motion-reduce:md:transition-none",
            settingsPanelOpen
              ? "md:w-[min(100%,28rem)]"
              : "md:pointer-events-none md:w-0"
          )}
          data-testid="settings-desktop-editor"
          data-settings-slide={settingsPanelOpen ? "in" : "out"}
          aria-hidden={!settingsPanelOpen}
          inert={!settingsPanelOpen ? true : undefined}
        >
          <div className="space-y-3 md:w-[min(100%,28rem)] md:pl-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  {settingsCopy.label}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {settingsCopy.description}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeSettingsPanel}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </div>
            {editor}
          </div>
        </div>
      ) : (
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
                <p className="font-display text-lg font-semibold tracking-tight">
                  {settingsCopy.label}
                </p>
              </div>
              <p className="pt-1 text-sm text-muted-foreground">
                {settingsCopy.description}
              </p>
            </div>
          }
        >
          {editor}
        </SidePanel>
      )}
    </div>
  );
}

function SettingsSectionEditor({
  settingsSection,
  ownGoals,
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
  ownGoals: Goal[];
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
              <span className="font-mono text-foreground">
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
    return <IntegrationsSettings goals={ownGoals} />;
  }

  return <ReportIssueSettings />;
}
