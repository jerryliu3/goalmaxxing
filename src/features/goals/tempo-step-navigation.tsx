"use client";

import { createContext, useContext } from "react";

export const TempoMethodContext = createContext<(() => void) | null>(null);
/**
 * The steps a goal needs, numbered; "More details" is optional, so it sits apart unnumbered
 * (and the caller leaves it out until the person opens it).
 */
const steps = ["Start", "Intention", "Rhythm", "Schedule", "Review", "More details"];
const OPTIONAL_STEP = steps.length - 1;

export function TempoStepNavigation({
  step,
  onStep,
  canVisit = [],
  disabled = false,
  skip = [],
}: {
  step: number;
  onStep?: (step: number) => void;
  canVisit?: boolean[];
  disabled?: boolean;
  /** Wizard steps (0 = Intention) this flow leaves out, e.g. a task has no details. */
  skip?: number[];
}) {
  const chooseMethod = useContext(TempoMethodContext);
  return (
    <nav className="tempo-steps" aria-label="Goal creation steps">
      {steps.map((name, index) => skip.includes(index - 1) ? null : (
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
