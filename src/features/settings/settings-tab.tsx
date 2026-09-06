"use client";

import {
  ArrowLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingCard } from "@/components/ui/loading-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OnboardingGuidesSettings } from "@/features/onboarding/onboarding-guides-settings";
import { IntegrationsSettings } from "@/features/settings/integrations-settings";
import { PlannerPreferencesSettings } from "@/features/settings/planner-preferences-settings";
import { ReportIssueSettings } from "@/features/settings/report-issue-settings";
import {
  resolveSettingsSection,
  SETTINGS_GROUPS,
  type SettingsSection,
} from "@/features/settings/settings-section";
import { NotificationsSection } from "@/features/social/notifications-section";
import { ProfileSection } from "@/features/social/profile-section";
import { useSocialTabData } from "@/features/social/use-social-tab-data";
import { useClientSearchParamsUpdater } from "@/lib/navigation/use-client-search-params-updater";

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
  const searchParams = useSearchParams();
  const { applySearchParams } = useClientSearchParamsUpdater();
  const requestedSection = resolveSettingsSection(searchParams.get("tab"));
  const settingsSection = requestedSection ?? "preferences";
  const settingsPanelOpen = requestedSection !== null;

  const writeSettingsSection = useCallback(
    (section: SettingsSection | null) => {
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
    writeSettingsSection(null);
  }, [writeSettingsSection]);

  const settingsSectionTitle =
    settingsSection === "preferences"
      ? "Preferences"
      : settingsSection === "notifications"
        ? "Notifications"
        : settingsSection === "integrations"
          ? "Integrations"
          : settingsSection === "onboarding"
            ? "Onboarding guides"
            : "Report an issue";
  const settingsSectionDescription =
    settingsSection === "preferences"
      ? "Manage planner defaults for Plan."
      : settingsSection === "notifications"
        ? "Configure push access and reminder schedules."
        : settingsSection === "integrations"
          ? "Connect Apple Health or Health Connect and opt into auto-complete."
          : settingsSection === "onboarding"
            ? "Replay the app intro and page guides."
            : "Send product bugs or UX friction details directly to support.";

  if (loading && !state.userId) {
    return (
      <LoadingCard
        title="Loading You..."
        description="Syncing your profile, notifications, and collaboration settings."
      />
    );
  }

  return (
    <div className="space-y-5">
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

      {SETTINGS_GROUPS.map((group) => (
        <Card key={group.key} className="shadow-sm">
          <CardHeader>
            <CardTitle>{group.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {group.items.map((item) => (
              <button
                key={item.key}
                type="button"
                className="flex w-full items-center justify-between border-t px-4 py-3 text-left text-base font-medium transition-colors hover:bg-muted/30 first:border-t-0"
                onClick={() => writeSettingsSection(item.key)}
              >
                <span>{item.label}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
            {group.key === "account" ? (
              <div className="border-t p-4">
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
          </CardContent>
        </Card>
      ))}

      <Dialog
        modal={false}
        open={settingsPanelOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeSettingsPanel();
          }
        }}
      >
        <DialogContent
          className="!top-0 !right-0 !left-auto !translate-x-0 !translate-y-0 inset-y-0 h-dvh w-[min(100vw,72rem)] max-w-none overflow-hidden rounded-none border-l p-0"
          showCloseButton={false}
        >
          <DialogHeader className="gap-3 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeSettingsPanel}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <DialogTitle>{settingsSectionTitle}</DialogTitle>
            </div>
            <DialogDescription>{settingsSectionDescription}</DialogDescription>
          </DialogHeader>
          <div className="h-[calc(100dvh-5.5rem)] overflow-y-auto overflow-x-hidden p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {settingsSection === "preferences" ? (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>
                    Manage planner defaults for Plan.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PlannerPreferencesSettings
                    value={plannerPreferencesDraft}
                    onChange={setPlannerPreferencesDraft}
                    disabled={plannerPreferencesLoading || saving}
                  />
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Privacy</p>
                        <p className="text-xs text-muted-foreground">
                          Control whether your social activity appears in leaderboards.
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
                            Turn off to hide your activity from leaderboard listings.
                          </span>
                        </span>
                      </label>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void savePreferences()}
                      disabled={
                        saving ||
                        plannerPreferencesLoading ||
                        !canSavePreferences
                      }
                    >
                      {saving ? "Saving..." : "Save preferences"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {settingsSection === "notifications" ? (
              <NotificationsSection />
            ) : null}

            {settingsSection === "onboarding" ? (
              <OnboardingGuidesSettings />
            ) : null}

            {settingsSection === "integrations" ? (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>
                    Connect Apple Health or Health Connect and opt into auto-complete.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <IntegrationsSettings goals={state.ownGoals} />
                </CardContent>
              </Card>
            ) : null}

            {settingsSection === "report-issue" ? (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Report an issue</CardTitle>
                  <CardDescription>
                    Submit an issue title and description. We will save every report and
                    email support when delivery is configured.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReportIssueSettings />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
