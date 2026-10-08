"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api/client";
import { useOnboardingProgress } from "@/features/onboarding/onboarding-progress-provider";
import { OnboardingTourBody } from "@/features/onboarding/tab-onboarding-overlay";
import { APP_TAB_TOUR_STEPS } from "@/features/onboarding/tab-onboarding";

const JourneySetupWizard = dynamic(() => import("./journey-setup-wizard").then(module => module.JourneySetupWizard));
export const JOURNEY_INTRO_OPEN_EVENT = "cadence.journey_intro.open";
export const TAB_TOUR_OPEN_EVENT = "cadence.tab_tour.open";
export function requestJourneyIntroOpen() { window.dispatchEvent(new Event(JOURNEY_INTRO_OPEN_EVENT)); }
export function requestTabTourOpen() { window.dispatchEvent(new Event(TAB_TOUR_OPEN_EVENT)); }
type Phase = "setup" | "invite" | "tabs" | "page-invite" | "closed";

export function JourneyIntroOverlay({ userId, enabled = true, onOpenChange }: { userId: string; enabled?: boolean; onOpenChange?: (open: boolean) => void }) {
  const account = useOnboardingProgress();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [replay, setReplay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progress = account?.progress;
  useEffect(() => {
    if (enabled && progress && phase === null) setPhase(!progress.completed_at ? "setup" : !progress.tours["app.tabs"] ? "invite" : "closed");
  }, [enabled, progress, phase]);
  useEffect(() => {
    onOpenChange?.(Boolean(enabled && account && (account.loading || account.error || phase !== "closed")));
  }, [enabled, account?.loading, account?.error, phase, onOpenChange]);
  useEffect(() => {
    const setup = () => { if (!progress) return; setReplay(Boolean(progress.completed_at)); setPhase("setup"); setError(null); };
    const tabs = () => { if (!progress?.completed_at) return; setReplay(true); setPhase("tabs"); setError(null); };
    window.addEventListener(JOURNEY_INTRO_OPEN_EVENT, setup);
    window.addEventListener(TAB_TOUR_OPEN_EVENT, tabs);
    return () => { window.removeEventListener(JOURNEY_INTRO_OPEN_EVENT, setup); window.removeEventListener(TAB_TOUR_OPEN_EVENT, tabs); };
  }, [progress]);
  if (!enabled || !account || account.loading || phase === "closed" || (!phase && !account.error)) return null;
  const save = async (action: Parameters<typeof account.save>[0], next: () => void) => {
    if (saving) return;
    setSaving(true); setError(null);
    try { await account.save(action); next(); }
    catch (cause) { setError(getApiErrorMessage(cause, "Your guide progress could not be saved. Try again.")); }
    finally { setSaving(false); }
  };
  if (phase === "setup" && progress) return <JourneySetupWizard key={`${userId}:${replay}`} userId={userId} replay={replay}
    onCancelReplay={() => setPhase("closed")} onDone={() => { setPhase(replay ? "closed" : "invite"); }} />;
  if (phase === "tabs") return <OnboardingTourBody onboardingKey="app.tabs" steps={APP_TAB_TOUR_STEPS} label="Tab tour" saving={saving} error={error}
    onClose={status => { void save({ action: "tour", key: "app.tabs", status }, () => setPhase(replay || progress?.tours["planner.calendar"] ? "closed" : "page-invite")); }} />;
  const startPage = () => { setPhase("closed"); router.push("/calendar?onboarding=planner.calendar"); };
  return <Dialog open onOpenChange={open => { if (!open && !saving && !account.error) void save(phase === "page-invite" ? { action: "tour", key: "planner.calendar", status: "skipped" } : { action: "skip-tours" }, () => setPhase("closed")); }}>
    <DialogContent className="z-[80]" overlayClassName="z-[80]" showCloseButton={false} onInteractOutside={event => event.preventDefault()}>
      <DialogHeader>
        <p className="type-eyebrow text-muted-foreground">{account.error ? "Getting started" : phase === "page-invite" ? "Optional · Agenda tour" : "Setup complete"}</p>
        <DialogTitle className="type-heading">{account.error ? "Let’s try that again." : phase === "page-invite" ? "Get to know Agenda." : "Your space is ready."}</DialogTitle>
        <DialogDescription>{account.error ?? (phase === "page-invite" ? "A short guide to Agenda. Skip it whenever you like." : "Want a quick look around?")}</DialogDescription>
      </DialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {account.error ? <Button onClick={account.reload}>Try again</Button> : <>
        <DialogFooter>
          <Button variant="ghost" disabled={saving} onClick={() => void save(phase === "page-invite" ? { action: "tour", key: "planner.calendar", status: "skipped" } : { action: "skip-tours" }, () => setPhase("closed"))}>{phase === "page-invite" ? "Skip Agenda tour" : "Skip all tours"}</Button>
          <Button disabled={saving || !progress} onClick={() => { if (phase === "page-invite") startPage(); else { setReplay(false); setPhase("tabs"); } }}>{phase === "page-invite" ? "Take Agenda tour" : "Take tab tour"}</Button>
        </DialogFooter>
      </>}
    </DialogContent>
  </Dialog>;
}
