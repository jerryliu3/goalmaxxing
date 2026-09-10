"use client";

import * as React from "react";
import { triggerLightPressFeedback } from "@/lib/feedback/haptics";

export const COMPLETION_HOLD_MS = 480;

const OPTIMISTIC_FALLBACK_MS = 8_000;

export type CompletionHoldCommitEvent =
  | React.MouseEvent<HTMLButtonElement>
  | React.KeyboardEvent<HTMLButtonElement>;

export type CompletionHoldCommitHandler = (
  event: CompletionHoldCommitEvent,
  sourceElement?: HTMLButtonElement
) => void | PromiseLike<void>;

function withStableCurrentTarget<T extends React.SyntheticEvent<HTMLButtonElement>>(
  event: T,
  currentTarget: HTMLButtonElement
) {
  const eventWithStableTarget = Object.create(event) as T;
  Object.defineProperty(eventWithStableTarget, "currentTarget", {
    value: currentTarget,
  });
  return eventWithStableTarget;
}

export function useCompletionHold({
  completed,
  disabled = false,
  pending = false,
  onCommit,
}: {
  completed: boolean;
  disabled?: boolean;
  pending?: boolean;
  onCommit?: CompletionHoldCommitHandler;
}) {
  const [optimisticCompleted, setOptimisticCompleted] = React.useState<boolean | null>(
    null
  );
  const [holding, setHolding] = React.useState(false);
  const [fillTransition, setFillTransition] = React.useState(false);
  const optimisticBaseStateRef = React.useRef<boolean | null>(null);
  const optimisticTimerRef = React.useRef<number | null>(null);
  const holdTimerRef = React.useRef<number | null>(null);
  const fillTransitionTimerRef = React.useRef<number | null>(null);

  const clearOptimisticState = React.useCallback(() => {
    setOptimisticCompleted(null);
    optimisticBaseStateRef.current = null;
    if (optimisticTimerRef.current !== null) {
      window.clearTimeout(optimisticTimerRef.current);
      optimisticTimerRef.current = null;
    }
  }, []);

  const clearFillTransitionTimer = React.useCallback(() => {
    if (fillTransitionTimerRef.current !== null) {
      window.clearTimeout(fillTransitionTimerRef.current);
      fillTransitionTimerRef.current = null;
    }
  }, []);

  const cancelHold = React.useCallback(() => {
    setHolding(false);
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    clearFillTransitionTimer();
    fillTransitionTimerRef.current = window.setTimeout(() => {
      fillTransitionTimerRef.current = null;
      setFillTransition(false);
    }, COMPLETION_HOLD_MS);
  }, [clearFillTransitionTimer]);

  React.useEffect(
    () => () => {
      if (optimisticTimerRef.current !== null) {
        window.clearTimeout(optimisticTimerRef.current);
      }
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
      }
      if (fillTransitionTimerRef.current !== null) {
        window.clearTimeout(fillTransitionTimerRef.current);
      }
    },
    []
  );

  React.useEffect(() => {
    if (
      optimisticCompleted !== null &&
      optimisticBaseStateRef.current !== null &&
      completed !== optimisticBaseStateRef.current
    ) {
      clearOptimisticState();
    }
  }, [clearOptimisticState, completed, optimisticCompleted]);

  const commitToggle = React.useCallback(
    (event: CompletionHoldCommitEvent, sourceElement?: HTMLButtonElement) => {
      triggerLightPressFeedback();
      const desiredState = !completed;
      optimisticBaseStateRef.current = completed;
      setOptimisticCompleted(desiredState);
      setHolding(false);
      setFillTransition(false);
      clearFillTransitionTimer();
      if (optimisticTimerRef.current !== null) {
        window.clearTimeout(optimisticTimerRef.current);
      }
      optimisticTimerRef.current = window.setTimeout(() => {
        setOptimisticCompleted(null);
        optimisticBaseStateRef.current = null;
        optimisticTimerRef.current = null;
      }, OPTIMISTIC_FALLBACK_MS);
      const mutation = onCommit?.(
        sourceElement ? withStableCurrentTarget(event, sourceElement) : event,
        sourceElement
      );
      if (mutation) {
        void Promise.resolve(mutation).then(clearOptimisticState, clearOptimisticState);
      }
    },
    [clearFillTransitionTimer, clearOptimisticState, completed, onCommit]
  );

  const visualCompleted = optimisticCompleted ?? completed;
  const fillProgress = holding ? (visualCompleted ? 0 : 1) : visualCompleted ? 1 : 0;

  const startHold = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.defaultPrevented || disabled || pending) {
        return;
      }
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      setHolding(true);
      setFillTransition(true);
      clearFillTransitionTimer();
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
      }
      const sourceElement = event.currentTarget;
      holdTimerRef.current = window.setTimeout(() => {
        holdTimerRef.current = null;
        commitToggle(
          event as unknown as React.MouseEvent<HTMLButtonElement>,
          sourceElement
        );
      }, COMPLETION_HOLD_MS);
    },
    [clearFillTransitionTimer, commitToggle, disabled, pending]
  );

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      startHold(event);
    },
    [startHold]
  );

  const handlePointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      cancelHold();
    },
    [cancelHold]
  );

  const handlePointerLeave = React.useCallback(() => {
    cancelHold();
  }, [cancelHold]);

  const handlePointerCancel = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      cancelHold();
    },
    [cancelHold]
  );

  const handleMouseDown = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  }, []);

  const handleTouchStart = React.useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  }, []);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.defaultPrevented || disabled || pending) {
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        commitToggle(event);
      }
    },
    [commitToggle, disabled, pending]
  );

  const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    completed,
    visualCompleted,
    holding,
    fillTransition,
    fillProgress,
    holdProps: {
      "data-completed": completed,
      "data-visual-completed": visualCompleted,
      "data-holding": holding ? "true" : "false",
      "data-fill-transition": fillTransition ? "true" : "false",
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
      onPointerCancel: handlePointerCancel,
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
      onKeyDown: handleKeyDown,
      onClick: handleClick,
    },
  };
}
