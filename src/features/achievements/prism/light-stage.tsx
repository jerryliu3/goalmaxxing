"use client";

import { useReducedMotion } from "motion/react";
import { useId, type CSSProperties, type ReactNode } from "react";
import { FLAT_POSE, REST_POSE, cardOptics } from "@/features/goals/card-material/card-optics";
import { useCardRotation } from "@/features/goals/card-material/use-card-rotation";

export function PrismLightStage({ className, children, label }: {
  className?: string;
  children: ReactNode;
  label: string;
}) {
  const still = Boolean(useReducedMotion());
  const rotation = useCardRotation(still, true);
  const helpId = useId();
  return (
    <>
      <div
        ref={rotation.stage}
        className={`prism-stage ${className ?? ""}`}
        data-light-stage=""
        role="group"
        aria-label={label}
        aria-describedby={helpId}
        tabIndex={still ? undefined : 0}
        style={cardOptics(still ? FLAT_POSE : REST_POSE) as CSSProperties}
        {...rotation.cardHandlers}
        {...rotation.stageHandlers}
      >
        {children}
      </div>
      <span id={helpId} className="sr-only">Drag to rotate. Arrow keys rotate; Home resets.</span>
    </>
  );
}
