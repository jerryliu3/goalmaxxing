"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";
import { dragPose, nearestPose, pointerPose, REST_POSE, type CardPose } from "./card-optics";
import { useCardPose } from "./use-card-pose";

/**
 * Capture on a 3D object is unreliable: WebKit rejects setPointerCapture when
 * currentTarget is not the event target, and lostpointercapture can fire in the
 * same pointerdown. Window listeners keep the turn going either way.
 */
export function useCardRotation(disabled: boolean, solid: boolean) {
  const [posed, setPosed] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const pose = useCardPose(disabled, posed);
  const drag = useRef<{ id: number; element: HTMLDivElement; x: number; y: number; start: CardPose; moved: boolean } | null>(null);
  const windowBound = useRef(false);
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const stopDragRef = useRef<() => void>(() => {});

  const applyDragMove = useCallback((pointerId: number, clientX: number, clientY: number) => {
    if (disabledRef.current) return;
    const active = drag.current;
    if (!active || active.id !== pointerId) return;
    const dx = clientX - active.x;
    const dy = clientY - active.y;
    if (!active.moved && Math.hypot(dx, dy) < 3) return;
    if (!active.moved) {
      active.moved = true;
      setInspecting(true);
    }
    poseRef.current.moveTo(dragPose(active.start, dx, dy), true);
  }, []);

  const onWindowPointerMove = useCallback((event: globalThis.PointerEvent) => {
    applyDragMove(event.pointerId, event.clientX, event.clientY);
  }, [applyDragMove]);
  const onWindowPointerUp = useCallback((event: globalThis.PointerEvent) => {
    if (drag.current?.id === event.pointerId) stopDragRef.current();
  }, []);

  const stopDrag = useCallback(() => {
    const active = drag.current;
    drag.current = null;
    if (windowBound.current) {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerUp);
      windowBound.current = false;
    }
    if (!active) return;
    active.element.closest<HTMLElement>("[data-material]")?.removeAttribute("data-dragging");
    try {
      if (active.element.hasPointerCapture(active.id)) active.element.releasePointerCapture(active.id);
    } catch {
      // Capture may already have been released by the browser.
    }
  }, [onWindowPointerMove, onWindowPointerUp]);
  stopDragRef.current = stopDrag;

  // Changing motion preferences or leaving the page must release capture.
  useEffect(() => stopDrag, [disabled, stopDrag]);

  const reset = () => {
    stopDrag();
    setInspecting(false);
    setPosed(false);
    pose.moveTo(nearestPose(pose.getCurrent(), REST_POSE));
  };
  const resolveObject = (event: PointerEvent<HTMLDivElement>) => {
    const current = event.currentTarget;
    if (current.hasAttribute("data-card-object")) {
      return current;
    }
    return (
      current.querySelector<HTMLDivElement>("[data-card-object]") ??
      (current.classList.contains("tempo-card-object") ? current : current.querySelector<HTMLDivElement>(".tempo-card-object"))
    );
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || !solid || event.button !== 0 || event.isPrimary === false || drag.current) return;
    if (
      event.target instanceof Element &&
      event.target.closest("button, input, textarea, select, a, [contenteditable='true']")
    ) {
      return;
    }
    const object = resolveObject(event);
    if (!object) return;
    if (event.target instanceof Node && event.target !== object && !object.contains(event.target)) {
      return;
    }
    event.preventDefault();
    object.focus({ preventScroll: true });
    pose.moveTo(pose.getCurrent(), true);
    drag.current = { id: event.pointerId, element: object, x: event.clientX, y: event.clientY, start: pose.getCurrent(), moved: false };
    pose.stage.current?.setAttribute("data-dragging", "true");
    if (!windowBound.current) {
      window.addEventListener("pointermove", onWindowPointerMove);
      window.addEventListener("pointerup", onWindowPointerUp);
      window.addEventListener("pointercancel", onWindowPointerUp);
      windowBound.current = true;
    }
    try {
      object.setPointerCapture(event.pointerId);
    } catch {
      // Window listeners still drive the drag if capture is refused.
    }
  };
  const onDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (drag.current) {
      applyDragMove(event.pointerId, event.clientX, event.clientY);
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
    cardHandlers: {
      onPointerDown,
      onDragStart,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
        if (drag.current?.id === event.pointerId) stopDrag();
      },
      onKeyDown,
    },
    stageHandlers: {
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => { if (drag.current?.id === event.pointerId) stopDrag(); },
      onPointerLeave: () => { if (!disabled && !drag.current && !inspecting) pose.reset(); },
      onPointerCancel: () => { stopDrag(); if (!disabled) reset(); },
    },
  };
}
