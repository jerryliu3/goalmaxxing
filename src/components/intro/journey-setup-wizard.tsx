"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api/client";
import { useOnboardingProgress } from "@/features/onboarding/onboarding-progress-provider";
import { JourneyIntroPreferencesStep, saveJourneyIntroPreferences, useJourneyIntroPreferences } from "./journey-intro-preferences-step";
import type { SetupProfileStatus } from "./setup-profile-card";
import { PracticeSessionStep } from "./practice-session-step";
import { PracticeMoveStep } from "./practice-move-step";
import { PracticeGoalStep } from "./practice-goal-step";

const titles = ["Welcome", "Mark a session done", "Move a session", "Finish a goal"];
const descriptions = [
  "Goalmaxxing turns a goal into sessions on your week. You plan the work, mark it done, and the goal card fills in as you go.",
  "Hold the circle to mark a session complete. This is the same control on your plan, and the stars are the XP it earns.",
  "Drag a session to another day when your week changes. Save keeps the move. Undo puts it back.",
  "One session is still missing. Hold it to finish the goal and play the ceremony.",
];

function SetupStepLoading() {
  return <div role="status" className="space-y-4">
    <span className="sr-only">Loading your setup…</span>
    <div aria-hidden className="mx-auto h-44 w-full max-w-sm animate-pulse rounded-2xl bg-muted" />
    <div aria-hidden className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
      <div className="h-11 animate-pulse rounded-xl bg-muted/80" />
      <div className="h-11 w-40 animate-pulse rounded-full bg-muted/80" />
    </div>
    <div aria-hidden className="h-11 w-full animate-pulse rounded-full bg-muted/70" />
  </div>;
}

export function JourneySetupWizard({ userId, replay, onDone, onCancelReplay }: { userId: string; replay: boolean; onDone: () => void; onCancelReplay: () => void }) {
  const account = useOnboardingProgress()!;
  const [step, setStep] = useState(replay ? 0 : account.progress!.setup_step);
  const [held, setHeld] = useState(!replay && step > 1);
  const [moved, setMoved] = useState(!replay && step > 2);
  const [ceremonyViewed, setCeremonyViewed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<SetupProfileStatus>("loading");
  const saveProfileRef = useRef<() => Promise<void>>(async () => {});
  const preferences = useJourneyIntroPreferences(userId, true);
  const preparing = step === 0 && (preferences.loading || profileStatus === "loading");
  const eligible = step === 0 ? !preparing && !preferences.error && profileStatus === "ready" : step === 1 ? held : step === 2 ? moved : ceremonyViewed;
  const advance = async () => {
    if (!eligible || saving) return;
    setSaving(true); setError(null);
    try {
      if (step === 0) {
        await saveJourneyIntroPreferences(userId, preferences.value);
        await saveProfileRef.current();
      }
      if (!replay) await account.save(step === 3 ? { action: "complete" } : { action: "advance", step: step + 1 });
      if (step === 3) onDone(); else setStep(value => value + 1);
    } catch (cause) { setError(getApiErrorMessage(cause, "Getting started could not be saved. Try again.")); }
    finally { setSaving(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && replay && !saving) onCancelReplay(); }}>
    <DialogContent className="z-[80] max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl" overlayClassName="z-[80]" showCloseButton={false}
      onEscapeKeyDown={event => { if (!replay || saving) event.preventDefault(); }}
      onInteractOutside={event => event.preventDefault()}>
      <DialogHeader>
        <p className="type-eyebrow text-muted-foreground">{step + 1} of 4</p>
        <div className="flex gap-1.5" aria-hidden>{titles.map((_title, index) => <span key={index} className={`h-1 flex-1 rounded-full ${index <= step ? "bg-foreground" : "bg-muted"}`} />)}</div>
        <DialogTitle>{titles[step]}</DialogTitle>
        <DialogDescription>{descriptions[step]}</DialogDescription>
      </DialogHeader>
      {preparing && <SetupStepLoading />}
      {step === 0 && <div hidden={preparing}><JourneyIntroPreferencesStep userId={userId} value={preferences.value} loading={preferences.loading || saving} onChange={preferences.setValue} saveProfileRef={saveProfileRef} onProfileStatusChange={setProfileStatus} /></div>}
      {step === 0 && preferences.error && <div role="alert"><p className="text-sm text-destructive">{preferences.error}</p><Button variant="outline" onClick={preferences.reload}>Reload preferences</Button></div>}
      {step === 1 && <PracticeSessionStep completed={held} onComplete={() => setHeld(true)} />}
      {step === 2 && <PracticeMoveStep completed={moved} onComplete={() => setMoved(true)} />}
      {step === 3 && <PracticeGoalStep onComplete={() => setCeremonyViewed(true)} />}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter className="flex-row flex-wrap justify-between sm:justify-between">
        <div className="flex gap-2">{step > 0 && <Button variant="ghost" disabled={saving} onClick={() => setStep(value => value - 1)}>Back</Button>}
          {replay && <Button variant="ghost" disabled={saving} onClick={onCancelReplay}>Close replay</Button>}</div>
        <Button disabled={!eligible || saving} onClick={() => void advance()}>{saving ? "Saving…" : step === 3 ? "Done" : "Continue"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
