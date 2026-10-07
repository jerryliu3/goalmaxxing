"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { CardSolidBody } from "./card-solid-body";
import { goalColorStyle } from "./goal-color-style";
import { cardOptics, FLAT_POSE, REST_POSE } from "./card-optics";
import type { TempoCardMaterial } from "./tempo-card-material";
import { useCardRotation } from "./use-card-rotation";

/**
 * Gives a material goal card its extruded body and pose-driven light. The card
 * itself stays the front face, so the surface adds depth and interaction
 * without owning content. Pointer movement tilts the card; a drag turns it in
 * the hand unless the host owns that gesture. Gallery hosts pass rotatable
 * false to freeze the pose instead of tracking the pointer.
 */
export function TempoCardSurface({
  material,
  goalColor,
  label,
  rotatable,
  children,
  solid = true,
}: {
  material: TempoCardMaterial;
  goalColor: string;
  label: string;
  rotatable: boolean;
  children: ReactNode;
  solid?: boolean;
}) {
  const hintId = useId();
  const still = Boolean(useReducedMotion());
  const frozen = still || !rotatable;
  const { stage, inspecting, isDragging, reset, stageHandlers, cardHandlers } =
    useCardRotation(frozen, rotatable);
  const held = rotatable && !still;

  // A product card must never be left stranded face-down, so letting go returns
  // it to rest instead of holding the inspected angle the way the study does.
  const releaseToRest = () => {
    if (!isDragging()) reset();
  };

  return (
    <div
      ref={stage}
      className="tempo-card-surface"
      data-material={material}
      data-still={frozen}
      data-rotatable={held}
      data-inspecting={inspecting}
      style={
        {
          ...cardOptics(frozen ? FLAT_POSE : REST_POSE),
          ...goalColorStyle(goalColor),
        } as CSSProperties
      }
      {...(held ? stageHandlers : {})}
      onPointerLeave={held ? releaseToRest : undefined}
    >
      <div
        className="tempo-card-object"
        data-card-object=""
        role={held ? "group" : undefined}
        aria-label={held ? `${label} rotation` : undefined}
        aria-describedby={held ? hintId : undefined}
        tabIndex={held ? 0 : undefined}
        {...(held ? cardHandlers : {})}
      >
        {solid && <CardSolidBody />}
        {children}
      </div>
      {/* Keyboard affordances are announced without adding chrome to the card. */}
      {held ? (
        <p id={hintId} className="sr-only">
          Drag to turn the card. Arrows rotate, Enter flips, Home resets.
        </p>
      ) : null}
    </div>
  );
}
