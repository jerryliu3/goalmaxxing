"use client";
import { useState } from "react";
import {
  TempoMethodContext,
  TempoStepNavigation,
} from "@/features/goals/tempo-step-navigation";
import { StudyDialog } from "@/features/ux-refresh/primitives";
import { Action } from "./common";

export function CreationNavigation() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  return (
    <section className="fc-section">
      <p className="type-eyebrow fc-muted">
        Small navigation proposal · finding 24
      </p>
      <h3 className="type-heading mt-3">An adjacent way back.</h3>
      <p className="fc-muted my-4">
        This excerpt adds Back and Cancel beside Continue on Intention. It
        covers Start, Intention and the entrance to Rhythm; the rest of creation
        is unchanged.
      </p>
      <Action
        variant="outline"
        onClick={() => {
          setStep(1);
          setOpen(true);
        }}
      >
        Try creation navigation
      </Action>
      <StudyDialog
        open={open}
        onOpenChange={setOpen}
        title={
          step === 0
            ? "Start a goal"
            : step === 1
              ? "Your intention"
              : "Your rhythm"
        }
        description="Give your goal a shape."
        footer={
          <>
            <Action
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setName("");
              }}
            >
              Cancel
            </Action>
            {step > 0 && (
              <Action variant="outline" onClick={() => setStep(step - 1)}>
                ← Back
              </Action>
            )}
            {step === 0 ? (
              <Action onClick={() => setStep(1)}>Create one goal</Action>
            ) : step === 1 ? (
              <Action disabled={!name.trim()} onClick={() => setStep(2)}>
                Continue →
              </Action>
            ) : (
              <Action onClick={() => setOpen(false)}>Close excerpt</Action>
            )}
          </>
        }
      >
        <TempoMethodContext.Provider value={() => setStep(0)}>
          <TempoStepNavigation
            step={step}
            onStep={(next) => setStep(next + 1)}
            canVisit={[true, !!name.trim()]}
          />
        </TempoMethodContext.Provider>
        {step === 0 ? (
          <p className="my-6">
            Start with one goal, then give it an intention and a rhythm.
          </p>
        ) : step === 1 ? (
          <label className="rf-field">
            Goal name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="What do you want to work toward?"
            />
          </label>
        ) : (
          <div className="my-6">
            <h4 className="type-heading">{name}</h4>
            <p className="fc-muted mt-3">
              The existing Rhythm step continues here.
            </p>
          </div>
        )}
      </StudyDialog>
    </section>
  );
}
