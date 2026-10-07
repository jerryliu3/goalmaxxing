"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  JourneyIntroPreferencesStep,
  saveJourneyIntroPreferences,
  useJourneyIntroPreferences,
} from "@/components/intro/journey-intro-preferences-step";
import {
  firstOnboardingElement,
  placeOnboardingCard,
  readOnboardingTargetRect,
} from "@/features/onboarding/onboarding-spotlight";
import { getApiErrorMessage } from "@/lib/api/client";
import { toLocalDateString } from "@/lib/dates/day";

export const JOURNEY_INTRO_SEEN_KEY = "cadence.journey_intro_seen.v1";
export const JOURNEY_ONBOARDING_COMPLETED_KEY =
  "cadence.journey_onboarding_completed.v1";
export const JOURNEY_INTRO_OPEN_EVENT = "cadence.journey_intro.open";

export function requestJourneyIntroOpen() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(JOURNEY_INTRO_OPEN_EVENT));
}

const JOURNEY_INTRO_STEPS = [
  {
    title: "Your preferences",
    description: "",
    target: "nav.settings",
    kind: "preferences" as const,
  },
  {
    title: "Agenda",
    description:
      "Start with Today. Switch to Week or Month when you want to plan ahead.",
    target: "nav.calendar",
    kind: "copy" as const,
  },
  {
    title: "Goals",
    description:
      "See your current and past goals, or create a new goal.",
    target: "nav.goals",
    kind: "copy" as const,
  },
  {
    title: "Growth",
    description:
      "See your Goal score, achievements and stats. The progress tracker lives on Growth.",
    target: "nav.growth",
    kind: "copy" as const,
  },
  {
    title: "Community",
    description:
      "Team, Challenges, and Leaderboards live here. Team stays available so you can still partner privately.",
    target: "nav.social",
    kind: "copy" as const,
  },
  {
    title: "Profile",
    description:
      "Your avatar opens profile and settings. With a partner, it also switches between Solo, Partner, and Duo views.",
    target: "nav.settings",
    kind: "copy" as const,
  },
] as const;

const TOUR_START_INDEX = 1;

interface JourneyIntroOverlayProps {
  userId: string;
  enabled?: boolean;
  preferencesRequired?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function subscribeNoop() {
  return () => {};
}

function getBrowserSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function JourneyIntroOverlay({
  userId,
  enabled = true,
  preferencesRequired = false,
  onOpenChange,
}: JourneyIntroOverlayProps) {
  const requestedOpen = useRef(false);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [preferencesPending, setPreferencesPending] = useState(preferencesRequired);
  const preferencesPendingRef = useRef(preferencesRequired);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [hasMeasured, setHasMeasured] = useState(false);
  const step = JOURNEY_INTRO_STEPS[stepIndex];
  const isLastStep = stepIndex >= JOURNEY_INTRO_STEPS.length - 1;
  const isPreferencesStep = step.kind === "preferences";
  const preferences = useJourneyIntroPreferences(userId, enabled && open && isPreferencesStep);
  const cardPosition =
    isPreferencesStep || !hasMeasured
      ? null
      : placeOnboardingCard(targetRect, {
          cardWidthPx: 320,
          estimatedHeightPx: 176,
        });
  const targetCandidates = useMemo(() => [step.target], [step.target]);

  useEffect(() => {
    requestedOpen.current = false;
    if (!enabled) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      if (requestedOpen.current) return;
      if (preferencesPendingRef.current) {
        setStepIndex(0);
        setOpen(true);
        onOpenChange?.(true);
        return;
      }
      const completed = window.localStorage.getItem(JOURNEY_ONBOARDING_COMPLETED_KEY);
      const lastSeen = window.localStorage.getItem(JOURNEY_INTRO_SEEN_KEY);
      const shouldOpen = completed !== "done" && lastSeen === null;
      if (shouldOpen) {
        setStepIndex(TOUR_START_INDEX);
      }
      setOpen(shouldOpen);
      onOpenChange?.(shouldOpen);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [userId, enabled, onOpenChange]);

  useEffect(() => {
    const handleOpenRequest = () => {
      requestedOpen.current = true;
      setStepIndex(0);
      setOpen(true);
      onOpenChange?.(true);
    };
    window.addEventListener(JOURNEY_INTRO_OPEN_EVENT, handleOpenRequest);
    return () => {
      window.removeEventListener(JOURNEY_INTRO_OPEN_EVENT, handleOpenRequest);
    };
  }, [onOpenChange]);

  useEffect(() => {
    if (!enabled || !open) {
      return;
    }
    void router.prefetch("/calendar");
    void router.prefetch("/calendar?view=day");
    void import("@/features/planner/calendar-page-shell");
  }, [enabled, open, router]);

  useEffect(() => {
    if (!enabled || !open || isPreferencesStep) {
      return;
    }
    let cancelled = false;
    const settleTimeoutIds: number[] = [];

    const readTarget = () => {
      if (cancelled) {
        return;
      }
      setTargetRect(readOnboardingTargetRect(targetCandidates));
      setHasMeasured(true);
    };

    const scheduleSettledMeasure = () => {
      const firstTarget = firstOnboardingElement(targetCandidates);
      if (firstTarget) {
        firstTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
      }

      // Layout can shift after signup (XP bar, fonts, nav). Re-measure after paint.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) {
            return;
          }
          readTarget();
          settleTimeoutIds.push(window.setTimeout(readTarget, 120));
          settleTimeoutIds.push(window.setTimeout(readTarget, 320));
        });
      });
    };

    scheduleSettledMeasure();
    window.addEventListener("resize", readTarget);
    window.addEventListener("scroll", readTarget, true);
    return () => {
      cancelled = true;
      for (const timeoutId of settleTimeoutIds) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener("resize", readTarget);
      window.removeEventListener("scroll", readTarget, true);
    };
  }, [enabled, open, isPreferencesStep, targetCandidates]);

  const isBrowser = useSyncExternalStore(
    subscribeNoop,
    getBrowserSnapshot,
    getServerSnapshot
  );

  const closeAndPersist = () => {
    window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
    window.localStorage.setItem(JOURNEY_INTRO_SEEN_KEY, toLocalDateString());
    setOpen(false);
    onOpenChange?.(false);
    setStepIndex(0);
  };

  const goToStep = (nextIndex: number) => {
    setHasMeasured(false);
    setStepIndex(Math.min(JOURNEY_INTRO_STEPS.length - 1, Math.max(0, nextIndex)));
  };

  const savePreferencesAndContinue = async () => {
    setSaving(true);
    try {
      await saveJourneyIntroPreferences(userId, preferences.value);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Preferences could not be saved."));
      setSaving(false);
      return;
    }
    setSaving(false);
    preferencesPendingRef.current = false;
    setPreferencesPending(false);
    goToStep(TOUR_START_INDEX);
  };

  const canSkip = !(isPreferencesStep && preferencesPending);

  if (!enabled || !open || !isBrowser) {
    return null;
  }

  const introDialog = (
    <Card
      className={
        isPreferencesStep
          ? "w-[min(26rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto shadow-lg"
          : "pointer-events-auto absolute w-[min(20rem,calc(100vw-2rem))] shadow-lg"
      }
      role="dialog"
      aria-modal={isPreferencesStep}
      aria-labelledby="journey-intro-title"
      style={
        cardPosition
          ? {
              top: cardPosition.top,
              left: cardPosition.left,
            }
          : undefined
      }
    >
      <CardHeader className="pb-2">
        <CardTitle id="journey-intro-title" className="text-base">
          {step.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-muted-foreground">
          Step {stepIndex + 1} of {JOURNEY_INTRO_STEPS.length}
        </p>
        {isPreferencesStep ? (
          <JourneyIntroPreferencesStep
            value={preferences.value}
            loading={preferences.loading || saving}
            onChange={preferences.setValue}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{step.description}</p>
        )}
        <div className="flex flex-wrap justify-between gap-2">
          {canSkip ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={closeAndPersist}
            >
              Skip tour
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {stepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => goToStep(stepIndex - 1)}
              >
                Back
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={saving || (isPreferencesStep && preferences.loading)}
              onClick={() => {
                if (isPreferencesStep) {
                  void savePreferencesAndContinue();
                  return;
                }
                if (isLastStep) {
                  closeAndPersist();
                  return;
                }
                goToStep(stepIndex + 1);
              }}
            >
              {isLastStep ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[80]">
      {!isPreferencesStep && targetRect ? (
        <div
          data-testid="onboarding-highlight"
          className="absolute rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      ) : null}
      {isPreferencesStep ? (
        <div
          data-testid="journey-intro-preferences-shell"
          className="pointer-events-auto fixed inset-0 flex items-center justify-center p-4"
        >
          {introDialog}
        </div>
      ) : cardPosition ? (
        introDialog
      ) : null}
    </div>,
    document.body
  );
}
