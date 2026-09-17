"use client";

import type { CSSProperties, ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { CardSolidBody } from "./card-solid-body";
import { cardOptics, FLAT_POSE, REST_POSE, pointerPose } from "./card-optics";
import type { TempoCardMaterial } from "./tempo-card-material";
import { useCardPose } from "./use-card-pose";

/**
 * Gives a material goal card its extruded body and pointer-driven light. The card
 * itself stays the front face, so the surface adds depth without owning content.
 */
export function TempoCardSurface({
  material,
  goalColor,
  children,
}: {
  material: TempoCardMaterial;
  goalColor: string;
  children: ReactNode;
}) {
  const still = Boolean(useReducedMotion());
  const pose = useCardPose(still, false);

  return (
    <div
      ref={pose.stage}
      className="tempo-card-surface"
      data-material={material}
      data-still={still}
      style={
        {
          ...cardOptics(still ? FLAT_POSE : REST_POSE),
          "--goal-color": goalColor,
        } as CSSProperties
      }
      onPointerMove={(event) => {
        if (still || event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        pose.moveTo(
          pointerPose(
            (event.clientX - rect.left) / rect.width,
            (event.clientY - rect.top) / rect.height,
          ),
        );
      }}
      onPointerLeave={() => {
        if (!still) pose.reset();
      }}
      onPointerCancel={() => {
        if (!still) pose.reset();
      }}
    >
      <div className="tempo-card-object">
        <CardSolidBody />
        {children}
      </div>
    </div>
  );
}
