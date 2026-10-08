"use client";

import { useState } from "react";
import {
  Action,
  AppNav,
  GoalArtifact,
  Heading,
  Notice,
  Panel,
} from "../primitives";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

export function CreationConcept() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [count, setCount] = useState("12");
  const [created, setCreated] = useState(false);
  const [message, setMessage] = useState("");
  const steps = ["Intention", "Rhythm", "Review"];
  const validName = name.trim().length > 0;
  const validCount =
    /^\d+$/.test(count) && Number(count) >= 1 && Number(count) <= 100;
  const cancel = () => {
    setStep(0);
    setName("");
    setCount("12");
    setCreated(false);
    setMessage("Sample creation cancelled. Nothing was saved.");
  };
  return (
    <>
      <AppNav active="Goals" />
      <div className="rf-canvas">
        <Heading
          eyebrow="New goal"
          title={
            created
              ? "An intention, ready to begin."
              : "Start with something that matters."
          }
        />
        <div className="rf-steps" aria-label="Creation steps">
          {steps.map((label, index) => (
            <span
              key={label}
              aria-current={!created && step === index ? "step" : undefined}
            >
              {index + 1} · {label}
            </span>
          ))}
        </div>
        {created ? (
          <Panel>
            <Check aria-hidden size={32} />
            <h3 className="type-title mt-4">{name}</h3>
            <p className="rf-muted my-5">
              Sample created · {count} completions in October. No real goal was
              created.
            </p>
            <Action onClick={cancel}>Start another sample</Action>
          </Panel>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (step === 0 && validName) setStep(1);
              else if (step === 1 && validCount) setStep(2);
              else if (step === 2 && validName && validCount) setCreated(true);
            }}
          >
            <div className="rf-split rf-split-equal">
              <Panel>
                {step === 0 ? (
                  <>
                    <h3 className="type-heading">
                      What do you want to work toward?
                    </h3>
                    <label className="rf-field">
                      Goal name
                      <input
                        required
                        maxLength={120}
                        placeholder="e.g. Run a comfortable 10K"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </label>
                  </>
                ) : step === 1 ? (
                  <>
                    <h3 className="type-heading">Give it a simple rhythm.</h3>
                    <label className="rf-field">
                      Completions this month
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={count}
                        onChange={(event) => setCount(event.target.value)}
                      />
                    </label>
                    <p className="rf-muted">
                      This study uses a simple October completion target to
                      demonstrate navigation. Production offers the full set of
                      rhythms.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="type-heading">Review your intention</h3>
                    <p className="type-item text-2xl my-5">{name}</p>
                    <p>{count} completions · October 1–31, 2026</p>
                    <p className="rf-muted mt-4">
                      The preview is a navigation concept, not a new production
                      creation contract.
                    </p>
                  </>
                )}
              </Panel>
              <Panel>
                <p className="type-eyebrow rf-muted mb-4">
                  Your card, taking shape
                </p>
                <GoalArtifact
                  id="run"
                  completed={0}
                  nameOverride={name || "Your next intention"}
                  targetOverride={validCount ? Number(count) : 1}
                />
              </Panel>
            </div>
            <footer className="rf-foot">
              <Action type="button" variant="ghost" onClick={cancel}>
                Cancel
              </Action>
              <div className="rf-actions">
                <Action
                  type="button"
                  variant="outline"
                  disabled={step === 0}
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft aria-hidden size={16} />
                  Back
                </Action>
                <Action
                  type="submit"
                  disabled={step === 0 ? !validName : !validCount}
                >
                  {step === 2 ? "Create sample goal" : "Continue"}
                  <ArrowRight aria-hidden size={16} />
                </Action>
              </div>
            </footer>
          </form>
        )}
        <Notice>{message}</Notice>
      </div>
    </>
  );
}
