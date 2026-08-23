"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type TabOnboardingKey,
  TAB_ONBOARDING_TOURS,
  isTabOnboardingCompleted,
  markTabOnboardingCompleted,
  subscribeTabOnboarding,
} from "@/features/onboarding/tab-onboarding";

interface TabOnboardingOverlayProps {
  onboardingKey: TabOnboardingKey;
  forceOpen?: boolean;
}

const CARD_WIDTH_PX = 320;
const CARD_ESTIMATED_HEIGHT_PX = 176;
const VIEWPORT_MARGIN_PX = 16;
const TARGET_GAP_PX = 12;

function placeCard(rect: DOMRect | null) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  if (!rect) {
    return {
      top: VIEWPORT_MARGIN_PX + 72,
      left: Math.max(VIEWPORT_MARGIN_PX, (viewportWidth - CARD_WIDTH_PX) / 2),
    };
  }

  const canPlaceBelow =
    rect.bottom + TARGET_GAP_PX + CARD_ESTIMATED_HEIGHT_PX <=
    viewportHeight - VIEWPORT_MARGIN_PX;
  const top = canPlaceBelow
    ? rect.bottom + TARGET_GAP_PX
    : Math.max(
        VIEWPORT_MARGIN_PX,
        rect.top - TARGET_GAP_PX - CARD_ESTIMATED_HEIGHT_PX
      );
  const left = Math.min(
    Math.max(rect.left, VIEWPORT_MARGIN_PX),
    viewportWidth - CARD_WIDTH_PX - VIEWPORT_MARGIN_PX
  );
  return { top, left };
}

export function TabOnboardingOverlay({
  onboardingKey,
  forceOpen = false,
}: TabOnboardingOverlayProps) {
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
  const steps = TAB_ONBOARDING_TOURS[onboardingKey];

  if (!open || steps.length === 0) {
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

function unionClientRects(elements: HTMLElement[]) {
  let top = Number.POSITIVE_INFINITY;
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    top = Math.min(top, rect.top);
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }
  return new DOMRect(left, top, right - left, bottom - top);
}

function queryOnboardingElements(target: string) {
  return Array.from(
    document.querySelectorAll(`[data-onboarding="${target}"]`)
  ).filter((element): element is HTMLElement => element instanceof HTMLElement);
}

function readOnboardingTargetRect(targets: readonly string[]) {
  for (const target of targets) {
    const elements = queryOnboardingElements(target);
    if (elements.length === 0) {
      continue;
    }
    return unionClientRects(elements);
  }
  return null;
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

function firstOnboardingElement(targets: readonly string[]) {
  for (const target of targets) {
    const [element] = queryOnboardingElements(target);
    if (element) {
      return element;
    }
  }
  return null;
}

function TabOnboardingTourBody({
  onboardingKey,
  steps,
  onClose,
}: {
  onboardingKey: TabOnboardingKey;
  steps: (typeof TAB_ONBOARDING_TOURS)[TabOnboardingKey];
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [hasMeasured, setHasMeasured] = useState(false);
  const step = steps[stepIndex];
  const isLastStep = stepIndex >= steps.length - 1;
  const cardPosition = hasMeasured ? placeCard(targetRect) : null;
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
