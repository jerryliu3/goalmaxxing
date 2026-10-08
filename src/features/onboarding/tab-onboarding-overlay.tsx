"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useOnboardingProgress } from "./onboarding-progress-provider";
import { getApiErrorMessage } from "@/lib/api/client";
import { createPortal } from "react-dom";
import { usePageOnboardingReady } from "@/features/onboarding/onboarding-readiness";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type TabOnboardingKey,
  type TabOnboardingStep,
  TAB_ONBOARDING_TOURS,
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
  const account = useOnboardingProgress();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completed = Boolean(account?.progress?.tours[onboardingKey]);
  const open = dismissedToken !== sessionToken && (forceOpen || !completed);
  const steps = stepsOverride ?? TAB_ONBOARDING_TOURS[onboardingKey];

  if (!ready || !account?.progress?.completed_at || !account.progress.tours["app.tabs"] || !open || steps.length === 0) {
    return null;
  }

  const closeAndPersist = async (status: "complete" | "skipped") => {
    if (saving) return;
    setSaving(true); setError(null);
    try {
      await account.save({ action: "tour", key: onboardingKey, status });
      setDismissedToken(sessionToken);
    } catch (cause) { setError(getApiErrorMessage(cause, "Guide progress could not be saved. Try again.")); }
    finally { setSaving(false); }
  };

  return (
    <OnboardingTourBody
      key={sessionToken}
      onboardingKey={onboardingKey}
      steps={steps}
      label={`${onboardingKey === "planner.calendar" ? "Agenda" : onboardingKey === "insights.main" ? "Growth" : "Community"} tour`}
      saving={saving} error={error}
      onClose={status => { void closeAndPersist(status); }}
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

export function OnboardingTourBody({
  onboardingKey,
  steps,
  onClose,
  label,
  saving = false,
  error,
}: {
  onboardingKey: string;
  steps: TabOnboardingStep[];
  label: string;
  saving?: boolean;
  error?: string | null;
  onClose: (status: "complete" | "skipped") => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [hasMeasured, setHasMeasured] = useState(false);
  const step = steps[stepIndex];
  const isLastStep = stepIndex >= steps.length - 1;
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(280);
  const cardPosition = hasMeasured ? placeOnboardingCard(targetRect, { estimatedHeightPx: cardHeight, cardWidthPx: Math.min(320, window.innerWidth - 32) }) : null;
  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const measure = () => setCardHeight(element.getBoundingClientRect().height || 280);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMeasured]);
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
          ref={cardRef}
          className="pointer-events-auto absolute max-h-[calc(100dvh-2rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto shadow-lg"
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
              {label} · {stepIndex + 1} of {steps.length}
            </p>
            <p className="text-sm text-muted-foreground">{step.description}</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => onClose("skipped")}>
                Skip tour
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={() => {
                  if (isLastStep) {
                    onClose("complete");
                    return;
                  }
                  setStepIndex((current) => Math.min(steps.length - 1, current + 1));
                }}
              >
                {saving ? "Saving…" : isLastStep ? "Finish tour" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>,
    document.body
  );
}
