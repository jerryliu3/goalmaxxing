"use client";

import Link from "next/link";
import { CoachProvider } from "@/features/coach/coach-provider";
import { UserRound } from "lucide-react";
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
import { AppBootSplash } from "@/components/layout/app-boot-splash";
import {
  isAppBootGatedPath,
  useReportAppSurfaceReady,
} from "@/components/layout/app-boot-ready";
import { PageOnboardingReadyContext } from "@/features/onboarding/onboarding-readiness";
import { TabNav } from "@/components/navigation/tab-nav";
import { GoalCreationActionContext } from "@/features/goals/new-goal-button";
import { Button } from "@/components/ui/button";
import { AltitudeBackdrop } from "@/components/xp/altitude-backdrop";
import { XpProfileProvider } from "@/components/xp/xp-profile-provider";
import { XpProgressBar } from "@/components/xp/xp-progress-bar";
import { XpRewardProvider } from "@/components/xp/xp-reward-provider";
import { PlaqueCompletionProvider } from "@/features/goals/plaque-completion-provider";
import { CompletionFeedbackProvider } from "@/components/feedback/completion-feedback-provider";
import { DuoProvider } from "@/features/social/duo/duo-context";
import { DuoScopeToggle } from "@/features/social/duo/duo-scope-toggle";
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
          {showJourneyIntro ? <JourneyIntroOverlay userId={userId} enabled={bootReady} onOpenChange={onIntroOpenChange} /> : null}
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
            <PublicProfileSheetProvider viewerUserId={userId} xpEnabled={xpEnabled}>
              <AppBootSplash onReady={onBootReady} />
              <div>
                <div className="relative z-10 flex min-h-screen w-full justify-center bg-page px-4 py-4 sm:px-6 sm:py-6">
                  <div className={`${coachStyles.appLayout} flex w-full flex-col gap-4 md:gap-6`}>
                  <header
                    data-testid="app-shell-header"
                    data-coach-anchor
                    className="sticky top-0 z-40 -mx-4 -mt-4 border-b border-border bg-page/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.7rem)] backdrop-blur supports-[backdrop-filter]:bg-page/80 md:m-0 md:border-0 md:rounded-xl md:bg-page/95 md:p-3"
                    style={{ viewTransitionName: "app-shell-header" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                        <p className="font-display shrink-0 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
                          Goalmaxxing
                        </p>
                        {xpEnabled ? (
                          <div className="min-w-0 flex-1">
                            <XpProgressBar />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <CoachHeader />
                          <Button asChild variant="outline" size="icon-sm" className="rounded-full" data-onboarding="nav.settings">
                            <Link href={withHrefPrefix("/settings", hrefPrefix)} aria-label="Profile and settings">
                              {viewerAvatarUrl && !hrefPrefix ? <img src={viewerAvatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" /> : <UserRound aria-hidden="true" />}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 hidden md:block">
                      <TabNav
                        hrefPrefix={hrefPrefix}
                      />
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
