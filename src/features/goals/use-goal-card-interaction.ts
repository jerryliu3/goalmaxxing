"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { flushSync } from "react-dom";
import { useReducedMotion } from "motion/react";
import { scheduleIdleTask } from "@/lib/browser/schedule-idle";
import { useGoalCardVisibility } from "./use-goal-card-visibility";

/** Keep only a flat face offscreen or in motion; prepare visible geometry at idle. */
export function useGoalCardInteraction({ fullRender = false, moving = false, preload = false }: {
  fullRender?: boolean;
  moving?: boolean;
  preload?: boolean;
}) {
  const { ref, nearViewport } = useGoalCardVisibility(preload ? 0 : 200);
  const reducedMotion = useReducedMotion();
  const [engaged, setEngaged] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const held = useRef(false);
  const hovered = useRef(false);
  useEffect(() => {
    if (!nearViewport || moving) {
      held.current = false;
      setEngaged(false);
      setPrepared(false);
    }
    if (!preload || !nearViewport || moving || reducedMotion) return;
    return scheduleIdleTask(() => setPrepared(true));
  }, [nearViewport, moving, preload, reducedMotion]);
  const interactive = nearViewport && !moving && (fullRender || prepared || engaged) && !reducedMotion;
  const interactionProps: HTMLAttributes<HTMLDivElement> = {
    tabIndex: interactive ? undefined : 0,
    onFocus: event => {
      if (moving) return;
      if (event.target === event.currentTarget) {
        flushSync(() => setEngaged(true));
        event.currentTarget.querySelector<HTMLElement>('[data-card-object][tabindex="0"]')?.focus({ preventScroll: true });
      } else setEngaged(true);
    },
    onBlur: event => { if (!event.currentTarget.contains(event.relatedTarget)) setEngaged(false); },
    onPointerEnter: event => {
      hovered.current = event.pointerType !== "touch";
      if (hovered.current && !moving) setEngaged(true);
    },
    onPointerLeave: () => { hovered.current = false; if (!held.current) setEngaged(false); },
    onPointerDownCapture: event => {
      if (moving || event.button !== 0 || event.isPrimary === false ||
        !(event.target instanceof Element) || !event.target.closest("[data-card-object]")) return;
      held.current = true;
      if (!interactive) flushSync(() => setEngaged(true));
    },
    onPointerUp: event => {
      held.current = false;
      if (event.pointerType !== "mouse" || !hovered.current) setEngaged(false);
    },
    onPointerCancel: () => { held.current = false; setEngaged(false); },
    onLostPointerCapture: () => { held.current = false; if (!hovered.current) setEngaged(false); },
  };
  return { ref, interactive, interactionProps };
}
