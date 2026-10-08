"use client";

import { createContext, useContext, useEffect, useRef } from "react";

export const TempoMethodContext = createContext<(() => void) | null>(null);
/** The steps a goal needs, numbered; "More details" is optional, so it sits apart unnumbered. */
const steps = ["Start", "Intention", "Rhythm", "Schedule", "Review", "More details"];
const OPTIONAL_STEP = steps.length - 1;

export function TempoStepNavigation({
  step,
  onStep,
  canVisit = [],
  canChooseMethod = true,
  disabled = false,
  showDetails = false,
}: {
  step: number;
  onStep?: (step: number) => void;
  canVisit?: boolean[];
  /** False once the goal is saved: there is no other way to begin it any more. */
  canChooseMethod?: boolean;
  disabled?: boolean;
  /** More details joins the bar only once the person opens them (tasks never have them). */
  showDetails?: boolean;
}) {
  const chooseMethod = useContext(TempoMethodContext);
  const nav = useRef<HTMLElement>(null);
  // On a narrow screen the bar scrolls; keep the current step in view.
  useEffect(() => {
    const current = nav.current?.querySelector<HTMLElement>("[aria-current]");
    if (!nav.current || !current) return;
    nav.current.scrollLeft = current.offsetLeft - (nav.current.clientWidth - current.offsetWidth) / 2;
  }, [step, showDetails]);
  return (
    <nav ref={nav} className="tempo-steps" aria-label="Goal creation steps">
      {steps.map((name, index) => index === OPTIONAL_STEP && !showDetails ? null : (
        <button
          type="button"
          key={name}
          aria-current={step === index ? "step" : undefined}
          data-optional={index === OPTIONAL_STEP || undefined}
          disabled={
            disabled || (index === 0 ? !chooseMethod || !canChooseMethod : !canVisit[index - 1])
          }
          onClick={() => (index === 0 ? chooseMethod?.() : onStep?.(index - 1))}
        >
          <span>{index === OPTIONAL_STEP ? "+" : `0${index + 1}`}</span>
          {name}
        </button>
      ))}
    </nav>
  );
}
