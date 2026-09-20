"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { dragPose, nearestPose, pointerPose, REST_POSE, type CardPose } from "./card-optics";
import { useCardPose } from "./use-card-pose";

export function useCardRotation(disabled: boolean, solid: boolean) {
  const [posed, setPosed] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const pose = useCardPose(disabled, posed);
  const drag = useRef<{ id: number; element: HTMLDivElement; x: number; y: number; start: CardPose; moved: boolean } | null>(null);
  const stopDrag = useCallback(() => {
    const active = drag.current;
    drag.current = null;
    if (!active) return;
    active.element.closest<HTMLElement>("[data-material]")?.removeAttribute("data-dragging");
    if (active.element.hasPointerCapture(active.id)) active.element.releasePointerCapture(active.id);
  }, []);
  // Changing motion preferences or leaving the page must release capture.
  useEffect(() => stopDrag, [disabled, stopDrag]);

  const reset = () => {
    stopDrag();
    setInspecting(false);
    setPosed(false);
    pose.moveTo(nearestPose(pose.getCurrent(), REST_POSE));
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || !solid || event.button !== 0 || event.isPrimary === false || drag.current) return;
    if (
      event.target instanceof Element &&
      event.target.closest("button, input, textarea, select, a, [contenteditable='true']")
    ) {
      return;
    }
    event.preventDefault();
    // Hosts with their own swipe (folio page turn, etc.) must not also claim this.
    event.stopPropagation();
    event.currentTarget.focus({ preventScroll: true });
    pose.moveTo(pose.getCurrent(), true);
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, element: event.currentTarget, x: event.clientX, y: event.clientY, start: pose.getCurrent(), moved: false };
    pose.stage.current?.setAttribute("data-dragging", "true");
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const active = drag.current;
    if (active) {
      if (active.id !== event.pointerId) return;
      const dx = event.clientX - active.x;
      const dy = event.clientY - active.y;
      if (!active.moved && Math.hypot(dx, dy) < 3) return;
      if (!active.moved) { active.moved = true; setInspecting(true); }
      pose.moveTo(dragPose(active.start, dx, dy), true);
    } else if (!inspecting && event.pointerType === "mouse") {
      const rect = event.currentTarget.getBoundingClientRect();
      pose.moveTo(nearestPose(pose.getCurrent(), pointerPose((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height)));
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || !solid || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Home" || event.key === "Escape") { event.preventDefault(); event.stopPropagation(); reset(); return; }
    const step = event.shiftKey ? 45 : 15;
    const current = pose.getTarget();
    const changes: Record<string, CardPose> = {
      ArrowLeft: { x: current.x, y: current.y - step }, ArrowRight: { x: current.x, y: current.y + step },
      ArrowUp: { x: current.x - step, y: current.y }, ArrowDown: { x: current.x + step, y: current.y },
      Enter: { x: current.x, y: current.y + 180 },
    };
    if (!changes[event.key]) return;
    event.preventDefault();
    event.stopPropagation();
    setInspecting(true);
    pose.moveTo(changes[event.key]);
  };
  return {
    stage: pose.stage, posed, inspecting, reset, isDragging: () => drag.current !== null,
    togglePose: () => { stopDrag(); setInspecting(false); setPosed(value => !value); },
    cardHandlers: { onPointerDown, onKeyDown, onLostPointerCapture: stopDrag },
    stageHandlers: {
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => { if (drag.current?.id === event.pointerId) stopDrag(); },
      onPointerLeave: () => { if (!disabled && !drag.current && !inspecting) pose.reset(); },
      onPointerCancel: () => { stopDrag(); if (!disabled) reset(); },
    },
  };
}
