"use client";

import { CoachProvider } from "@/features/coach/coach-provider";
import { usePathname } from "next/navigation";
import { Fragment, type ReactNode, useCallback, useState, ViewTransition } from "react";
import { JourneyIntroOverlay } from "@/components/intro/journey-intro-overlay";
import { CoachHeader } from "@/features/coach/coach-header";
import { CoachSurface } from "@/features/coach/coach-surface";
import { CoachPageFrame } from "@/features/coach/coach-page-frame";
import coachStyles from "@/features/coach/coach.module.css";
import { CheckInOverlay } from "@/features/digest/check-in-overlay";
import { JourneyProvider } from "@/components/journey/journey-provider.web";
import type { JourneyFeatureFlags } from "@/components/journey/types";
import { AccountMenu } from "@/components/layout/account-menu";
import { AppBootSplash } from "@/components/layout/app-boot-splash";
import {
  isAppBootGatedPath,
  useReportAppSurfaceReady,
} from "@/components/layout/app-boot-ready";
import { PageOnboardingReadyContext } from "@/features/onboarding/onboarding-readiness";
import { TabNav } from "@/components/navigation/tab-nav";
import { GoalCreationActionContext } from "@/features/goals/new-goal-button";
import { AltitudeBackdrop } from "@/components/xp/altitude-backdrop";
import { XpProfileProvider } from "@/components/xp/xp-profile-provider";
import { Wordmark, XpWordmark } from "@/components/xp/xp-wordmark";
import { XpRewardProvider } from "@/components/xp/xp-reward-provider";
import { PlaqueCompletionProvider } from "@/features/goals/plaque-completion-provider";
import { CompletionFeedbackProvider } from "@/components/feedback/completion-feedback-provider";
import { DuoProvider } from "@/features/social/duo/duo-context";
import { PublicProfileSheetProvider } from "@/features/social/public-profile/public-profile-sheet-provider";
import { setTabDataCacheScope } from "@/lib/cache/tab-data-cache";
import { useIdleAppPrefetch } from "@/lib/cache/use-idle-app-prefetch";
import { withHrefPrefix } from "@/lib/navigation/demo-path";
import type {
  DuoAvailability,
  DuoContextState,
  DuoScope,
} from "@cadence/shared/social/duo";

interface AppShellProps {
  children: ReactNode;
  userId: string;
  viewerLabel?: string | null;
  viewerAvatarUrl?: string | null;
  goalSheet?: ReactNode;
  duoState: DuoContextState;
  duoAvailability: DuoAvailability;
  initialDuoScopePreference: DuoScope | null;
  journeyFlags: JourneyFeatureFlags;
  hrefPrefix?: string;
  showJourneyIntro?: boolean;
  onboardingPreferencesRequired?: boolean;
  digestEnabled?: boolean;
  coachEnabled?: boolean;
  onNewGoalClick?: () => void;
  xpEnabled?: boolean;
}

export function AppShell({
  children,
  userId,
  viewerLabel,
  viewerAvatarUrl,
  goalSheet,
  duoState,
  duoAvailability,
  initialDuoScopePreference,
  journeyFlags,
  hrefPrefix,
  showJourneyIntro = true,
  onboardingPreferencesRequired = false,
  digestEnabled = false,
  coachEnabled = false,
  onNewGoalClick,
  xpEnabled = true,
}: AppShellProps) {
  const [bootReady, setBootReady] = useState(false);
  const [navigationIntroReady, setNavigationIntroReady] = useState(!showJourneyIntro);
  const onBootReady = useCallback(() => setBootReady(true), []);
  const onIntroOpenChange = useCallback((open: boolean) => {
    setNavigationIntroReady(!open);
  }, []);
  setTabDataCacheScope(userId);
  useIdleAppPrefetch({
    userId,
    partnerId: duoState.activePartner?.partnerId ?? null,
    hrefPrefix,
  });
  const pathname = usePathname();
  useReportAppSurfaceReady(!isAppBootGatedPath(pathname));
  const mainContent = (
    <main className="relative z-10 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <CoachPageFrame>{children}</CoachPageFrame>
    </main>
  );
  const ViewTransitionWrapper =
    typeof ViewTransition === "function" ? ViewTransition : Fragment;

  return (
    <GoalCreationActionContext.Provider value={onNewGoalClick}>
    <PageOnboardingReadyContext.Provider value={bootReady && (!showJourneyIntro || navigationIntroReady)}>
    <CoachProvider userId={userId} enabled={coachEnabled && !hrefPrefix} digestEnabled={digestEnabled}>
    <XpRewardProvider>
      <CompletionFeedbackProvider>
      <PlaqueCompletionProvider>
      <XpProfileProvider enabled={xpEnabled}>
        <JourneyProvider flags={journeyFlags}>
          <AltitudeBackdrop journeyFlags={journeyFlags} />
          {showJourneyIntro ? (
            <JourneyIntroOverlay
              userId={userId}
              enabled={bootReady}
              preferencesRequired={onboardingPreferencesRequired}
              onOpenChange={onIntroOpenChange}
            />
          ) : null}
          {digestEnabled && (!coachEnabled || hrefPrefix) ? <CheckInOverlay hrefPrefix={hrefPrefix} /> : null}
          <DuoProvider
            key={`${duoAvailability}:${duoState.activePartner?.partnerId ?? "none"}`}
            viewerUserId={userId}
            viewerLabel={viewerLabel}
            viewerAvatarUrl={viewerAvatarUrl}
            initialState={duoState}
            availability={duoAvailability}
            initialScopePreference={initialDuoScopePreference}
          >
            <PublicProfileSheetProvider xpEnabled={xpEnabled}>
              <AppBootSplash onReady={onBootReady} />
              <div>
                <div className="relative z-10 flex min-h-screen w-full justify-center bg-page px-4 py-4 sm:px-6 sm:py-6 lg:px-12">
                  <div className={`${coachStyles.appLayout} flex w-full flex-col gap-4 md:gap-6`}>
                  {/* Three zones: status, destinations, then coach and the account menu
                      (which also holds Solo / Duo). Controls are 36px; the avatar is 40px
                      to match the wordmark meter's height. One row from lg; tabs wrap
                      below on tablets. */}
                  <header
                    data-testid="app-shell-header"
                    data-coach-anchor
                    className="sticky top-0 z-40 -mx-4 -mt-4 border-b border-border bg-page/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.7rem)] backdrop-blur supports-[backdrop-filter]:bg-page/80 md:m-0 md:bg-page/95 md:px-0 md:pb-0 md:pt-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-6 lg:pt-0"
                    style={{ viewTransitionName: "app-shell-header" }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 lg:contents">
                      <div className="min-w-0 flex-1 lg:justify-self-start">
                        {xpEnabled ? <XpWordmark /> : <Wordmark />}
                      </div>
                      <div className="hidden md:order-last md:flex md:basis-full md:justify-center lg:order-none lg:basis-auto">
                        <TabNav hrefPrefix={hrefPrefix} />
                      </div>
                      <div className="flex shrink-0 items-center gap-2 lg:justify-self-end">
                        <CoachHeader />
                        <AccountMenu settingsHref={withHrefPrefix("/settings", hrefPrefix)} showPhotos={!hrefPrefix} />
                      </div>
                    </div>
                  </header>

                  {ViewTransitionWrapper === ViewTransition ? (
                    <ViewTransition
                      name="app-main-content"
                      enter={{
                        "nav-forward": "app-nav-forward",
                        "nav-back": "app-nav-back",
                        default: "app-nav-crossfade",
                      }}
                      exit={{
                        "nav-forward": "app-nav-forward",
                        "nav-back": "app-nav-back",
                        default: "app-nav-crossfade",
                      }}
                      default="none"
                    >
                      {mainContent}
                    </ViewTransition>
                  ) : (
                    <ViewTransitionWrapper>{mainContent}</ViewTransitionWrapper>
                  )}
                  </div>
                </div>
                <div className="relative z-50 md:hidden" style={{ viewTransitionName: "app-mobile-tab-nav" }}>
                  <TabNav
                    mobile
                    hrefPrefix={hrefPrefix}
                  />
                </div>
                <CoachSurface />
                {goalSheet}
              </div>
            </PublicProfileSheetProvider>
          </DuoProvider>
        </JourneyProvider>
      </XpProfileProvider>
      </PlaqueCompletionProvider>
      </CompletionFeedbackProvider>
    </XpRewardProvider>
    </CoachProvider>
    </PageOnboardingReadyContext.Provider>
    </GoalCreationActionContext.Provider>
  );
}
