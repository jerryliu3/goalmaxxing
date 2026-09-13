"use client";

import { createContext, useContext } from "react";

export const TempoMethodContext = createContext<(() => void) | null>(null);
const steps = ["Start", "Intention", "Rhythm", "Schedule", "Review"];

export function TempoStepNavigation({
  step,
  onStep,
  canVisit = [],
  disabled = false,
}: {
  step: number;
  onStep?: (step: number) => void;
  canVisit?: boolean[];
  disabled?: boolean;
}) {
  const chooseMethod = useContext(TempoMethodContext);
  return (
    <nav className="tempo-steps" aria-label="Goal creation steps">
      {steps.map((name, index) => (
        <button
          type="button"
          key={name}
          aria-current={step === index ? "step" : undefined}
          disabled={
            disabled || (index === 0 ? !chooseMethod : !canVisit[index - 1])
          }
          onClick={() => (index === 0 ? chooseMethod?.() : onStep?.(index - 1))}
        >
          <span>0{index + 1}</span>
          {name}
        </button>
      ))}
    </nav>
  );
}
