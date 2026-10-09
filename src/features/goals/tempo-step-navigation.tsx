"use client";

import { createContext, useContext } from "react";

export const TempoMethodContext = createContext<(() => void) | null>(null);
/** The steps a goal needs, numbered; "More details" is optional, so it sits apart unnumbered. */
const steps = ["Start", "Intention", "Rhythm", "Schedule", "Review", "More details"];
const OPTIONAL_STEP = steps.length - 1;

export function TempoStepNavigation({
  step,
  onStep,
  canVisit = [],
  disabled = false,
  showDetails = false,
}: {
  step: number;
  onStep?: (step: number) => void;
  canVisit?: boolean[];
  disabled?: boolean;
  /** More details joins the bar only once the person opens them (tasks never have them). */
  showDetails?: boolean;
}) {
  const chooseMethod = useContext(TempoMethodContext);
  return (
    <nav className="tempo-steps" aria-label="Goal creation steps">
      {steps.map((name, index) => index === OPTIONAL_STEP && !showDetails ? null : (
        <button
          type="button"
          key={name}
          aria-current={step === index ? "step" : undefined}
          data-optional={index === OPTIONAL_STEP || undefined}
          disabled={
            disabled || (index === 0 ? !chooseMethod : !canVisit[index - 1])
          }
          onClick={() => (index === 0 ? chooseMethod?.() : onStep?.(index - 1))}
        >
          <span>{index === OPTIONAL_STEP ? "+" : `0${index + 1}`}</span>
          {index === OPTIONAL_STEP ? (
            <em>
              {name} <small>(optional)</small>
            </em>
          ) : (
            name
          )}
        </button>
      ))}
    </nav>
  );
}
