"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toLocalDateString } from "@/lib/dates/day";
import { useXpProfile } from "@/components/xp/xp-profile-provider";

export const JOURNEY_INTRO_SEEN_KEY = "cadence.journey_intro_seen.v1";
export const JOURNEY_ONBOARDING_COMPLETED_KEY =
  "cadence.journey_onboarding_completed.v1";
export const JOURNEY_INTRO_FORCE_USER_ID_KEY =
  "cadence.journey_intro_force_user_id.v1";
export const JOURNEY_INTRO_OPEN_EVENT = "cadence.journey_intro.open";

export function requestJourneyIntroOpen() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(JOURNEY_INTRO_OPEN_EVENT));
}

interface JourneyIntroOverlayProps {
  userId: string;
}

export function JourneyIntroOverlay({ userId }: JourneyIntroOverlayProps) {
  const { band } = useXpProfile();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    {
      title: "Welcome to Goalmaxxing",
      body: (
        <>
          <p className="text-muted-foreground">
            Goalmaxxing helps you set short-term and long-term goals, then follow
            through with a plan you can execute.
          </p>
          <p className="text-muted-foreground">
            Create goals, track progress, and stay accountable with community.
          </p>
        </>
      ),
    },
    {
      title: "Create different types of goals",
      body: (
        <>
          <p className="text-muted-foreground">
            Create repeating goals for habits, and milestone goals for projects
            with a finish line.
          </p>
          <p className="text-muted-foreground">
            Each goal can have its own schedule, targets, and dates.
          </p>
        </>
      ),
    },
    {
      title: "Plan and execute",
      body: (
        <>
          <p className="text-muted-foreground">
            Use Calendar to plan individual sessions across the coming
            days/weeks/months.
          </p>
          <p className="text-muted-foreground">
            Use Checklist to focus on specific days, and Tasks to capture small
            one-off items.
          </p>
        </>
      ),
    },
    {
      title: "Stay accountable",
      body: (
        <>
          <p className="text-muted-foreground">
            Check the Community tab to interact with others, or participate in
            group challenges and events.
          </p>
          <p className="text-muted-foreground">
            You can also invite a friend to partner up, see each other&apos;s
            progress and keep accountability.
          </p>
        </>
      ),
    },
    {
      title: "Your goals are ready",
      body: (
        <>
          <p className="text-muted-foreground">
            We&apos;ve added some initial goals to get you familiar. You can
            edit these anytime as you shape your own system.
          </p>
          <p className="text-muted-foreground">
            Every check-in moves you upward. Your current camp is{" "}
            <span className="font-medium text-foreground">{band.name}</span>.
          </p>
        </>
      ),
    },
  ] as const;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const forcedIntroUserId = window.localStorage.getItem(
        JOURNEY_INTRO_FORCE_USER_ID_KEY
      );
      if (forcedIntroUserId === userId) {
        window.localStorage.removeItem(JOURNEY_INTRO_FORCE_USER_ID_KEY);
        setOpen(true);
        return;
      }
      const completed = window.localStorage.getItem(JOURNEY_ONBOARDING_COMPLETED_KEY);
      const lastSeen = window.localStorage.getItem(JOURNEY_INTRO_SEEN_KEY);
      if (completed !== "done" && lastSeen === null) {
        setOpen(true);
      }
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [userId]);

  useEffect(() => {
    const handleOpenRequest = () => {
      setStepIndex(0);
      setOpen(true);
    };
    window.addEventListener(JOURNEY_INTRO_OPEN_EVENT, handleOpenRequest);
    return () => {
      window.removeEventListener(JOURNEY_INTRO_OPEN_EVENT, handleOpenRequest);
    };
  }, []);

  if (!open) {
    return null;
  }

  const step = steps[stepIndex];
  const isLastStep = stepIndex >= steps.length - 1;

  const closeAndPersist = () => {
    window.localStorage.setItem(JOURNEY_ONBOARDING_COMPLETED_KEY, "done");
    window.localStorage.setItem(JOURNEY_INTRO_SEEN_KEY, toLocalDateString());
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="journey-intro-title"
    >
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle id="journey-intro-title">{step.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {steps.length}
          </p>
          {step.body}
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={closeAndPersist}
            >
              Skip intro
            </Button>
            <div className="flex gap-2">
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                >
                  Back
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={() => {
                  if (isLastStep) {
                    closeAndPersist();
                    return;
                  }
                  setStepIndex((current) => Math.min(steps.length - 1, current + 1));
                }}
              >
                {isLastStep ? "Done" : "Next"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
