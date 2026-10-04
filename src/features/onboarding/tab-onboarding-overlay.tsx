"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePageOnboardingReady } from "@/features/onboarding/onboarding-readiness";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type TabOnboardingKey,
  type TabOnboardingStep,
  TAB_ONBOARDING_TOURS,
  isTabOnboardingCompleted,
  markTabOnboardingCompleted,
  subscribeTabOnboarding,
} from "@/features/onboarding/tab-onboarding";
import {
  firstOnboardingElement,
  placeOnboardingCard,
  readOnboardingTargetRect,
} from "@/features/onboarding/onboarding-spotlight";

interface TabOnboardingOverlayProps {
  onboardingKey: TabOnboardingKey;
  forceOpen?: boolean;
  steps?: TabOnboardingStep[];
}

export function TabOnboardingOverlay({
  onboardingKey,
  forceOpen = false,
  steps: stepsOverride,
}: TabOnboardingOverlayProps) {
  const ready = usePageOnboardingReady();
  const sessionToken = useMemo(
    () => `${forceOpen ? "force" : "default"}:${onboardingKey}`,
    [forceOpen, onboardingKey]
  );
  const [dismissedToken, setDismissedToken] = useState<string | null>(null);
  const completed = useSyncExternalStore(
    subscribeTabOnboarding,
    () => isTabOnboardingCompleted(onboardingKey),
    () => true
  );
  const open =
    dismissedToken !== sessionToken &&
    (forceOpen || !completed);
  const steps = stepsOverride ?? TAB_ONBOARDING_TOURS[onboardingKey];

  if (!ready || !open || steps.length === 0) {
    return null;
  }

  const closeAndPersist = () => {
    markTabOnboardingCompleted(onboardingKey);
    setDismissedToken(sessionToken);
  };

  return (
    <TabOnboardingTourBody
      key={sessionToken}
      onboardingKey={onboardingKey}
      steps={steps}
      onClose={closeAndPersist}
    />
  );
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

function TabOnboardingTourBody({
  onboardingKey,
  steps,
  onClose,
}: {
  onboardingKey: TabOnboardingKey;
  steps: TabOnboardingStep[];
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [hasMeasured, setHasMeasured] = useState(false);
  const step = steps[stepIndex];
  const isLastStep = stepIndex >= steps.length - 1;
  const cardPosition = hasMeasured ? placeOnboardingCard(targetRect) : null;
  const targetCandidates = useMemo(
    () => [step.target, ...(step.fallbackTargets ?? [])],
    [step.fallbackTargets, step.target]
  );

  useEffect(() => {
    const readTarget = () => {
      setTargetRect(readOnboardingTargetRect(targetCandidates));
    };

    const timeoutId = window.setTimeout(() => {
      const firstTarget = firstOnboardingElement(targetCandidates);
      if (firstTarget) {
        firstTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      readTarget();
      setHasMeasured(true);
    }, 0);

    window.addEventListener("resize", readTarget);
    window.addEventListener("scroll", readTarget, true);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", readTarget);
      window.removeEventListener("scroll", readTarget, true);
    };
  }, [targetCandidates]);

  const isBrowser = useSyncExternalStore(
    subscribeNoop,
    getBrowserSnapshot,
    getServerSnapshot
  );

  if (!isBrowser) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[80]">
      {targetRect ? (
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
      {cardPosition ? (
        <Card
          className="pointer-events-auto absolute w-[min(20rem,calc(100vw-2rem))] shadow-lg"
          role="dialog"
          aria-modal="false"
          aria-labelledby={`tab-onboarding-${onboardingKey}`}
          style={{
            top: cardPosition.top,
            left: cardPosition.left,
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle id={`tab-onboarding-${onboardingKey}`} className="text-base">
              {step.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <p className="text-sm text-muted-foreground">{step.description}</p>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Dismiss
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (isLastStep) {
                    onClose();
                    return;
                  }
                  setStepIndex((current) => Math.min(steps.length - 1, current + 1));
                }}
              >
                {isLastStep ? "Got it" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>,
    document.body
  );
}
