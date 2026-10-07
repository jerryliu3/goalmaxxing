"use client";

import { useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { FLAT_POSE, REST_POSE, cardOptics, pointerPose } from "@/features/goals/card-material/card-optics";
import { useCardPose } from "@/features/goals/card-material/use-card-pose";

/** Reuse the card pose pipeline for one pointer-driven lamp across hero medals. */
export function PrismLightStage({ className, children }: { className?: string; children: ReactNode }) {
  const still = Boolean(useReducedMotion());
  const pose = useCardPose(still, false);
  return (
    <div
      ref={pose.stage}
      className={className}
      data-light-stage=""
      style={cardOptics(still ? FLAT_POSE : REST_POSE) as CSSProperties}
      onPointerMove={(event) => {
        if (still || event.pointerType === "touch") return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        pose.moveTo(pointerPose((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height));
      }}
      onPointerLeave={() => {
        if (!still) pose.reset();
      }}
    >
      {children}
    </div>
  );
}
