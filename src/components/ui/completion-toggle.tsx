"use client";

import * as React from "react";
import { useUiStyle } from "@/components/brand/ui-style-provider";
import { StyleCompletionMark } from "@/components/ui/style-completion-mark";
import { triggerLightPressFeedback } from "@/lib/feedback/haptics";
import { cn } from "@/lib/utils";

export const COMPLETION_HOLD_MS = 480;

const sizeClasses = {
  sm: {
    button: "size-6",
    icon: "size-3.5",
  },
  md: {
    button: "size-8",
    icon: "size-4",
  },
  lg: {
    button: "size-10",
    icon: "size-5",
  },
} as const;

type CompletionToggleClickHandler = (
  event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
) => void | PromiseLike<void>;

interface CompletionToggleProps
  extends Omit<React.ComponentProps<"button">, "children" | "onClick"> {
  completed: boolean;
  pending?: boolean;
  size?: keyof typeof sizeClasses;
  chrome?: "button" | "plain";
  onClick?: CompletionToggleClickHandler;
}

export function CompletionToggle({
  completed,
  pending = false,
  size = "md",
  chrome = "button",
  className,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  disabled,
  title,
  ...props
}: CompletionToggleProps) {
  const { style } = useUiStyle();
  const OPTIMISTIC_FALLBACK_MS = 8_000;
  const classes = sizeClasses[size];
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
    (
      event:
        | React.MouseEvent<HTMLButtonElement>
        | React.KeyboardEvent<HTMLButtonElement>
    ) => {
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
      const mutation = onClick?.(event);
      if (mutation) {
        void Promise.resolve(mutation).then(clearOptimisticState, clearOptimisticState);
      }
    },
    [clearFillTransitionTimer, clearOptimisticState, completed, onClick]
  );

  const visualCompleted = optimisticCompleted ?? completed;
  const fillProgress = holding ? (visualCompleted ? 0 : 1) : visualCompleted ? 1 : 0;

  return (
    <button
      type="button"
      data-completed={completed}
      data-visual-completed={visualCompleted}
      data-holding={holding ? "true" : "false"}
      data-fill-transition={fillTransition ? "true" : "false"}
      data-motion="completion-toggle"
      aria-busy={pending || undefined}
      disabled={disabled}
      className={cn(
        "group relative isolate flex shrink-0 touch-manipulation items-center justify-center overflow-visible bg-transparent transition-[transform,box-shadow,border-color,color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none hover:bg-transparent active:bg-transparent",
        chrome === "button" &&
          "border border-border bg-background shadow-sm hover:border-primary hover:bg-background active:bg-background active:shadow-none",
        chrome === "plain" && "border-0 shadow-none",
        chrome === "button" &&
          (style.completionMark === "nest" ? "rounded-md" : "rounded-full"),
        holding && "text-primary",
        classes.button,
        className
      )}
      onPointerDown={(event) => {
        event.stopPropagation();
        onPointerDown?.(event);
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
        holdTimerRef.current = window.setTimeout(() => {
          holdTimerRef.current = null;
          commitToggle(event as unknown as React.MouseEvent<HTMLButtonElement>);
        }, COMPLETION_HOLD_MS);
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
      onTouchStart={(event) => {
        event.stopPropagation();
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        onPointerUp?.(event);
        cancelHold();
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        cancelHold();
      }}
      onPointerCancel={(event) => {
        event.stopPropagation();
        onPointerCancel?.(event);
        cancelHold();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled || pending) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          commitToggle(event);
        }
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      {...props}
      title={title ?? "Hold to change completion"}
    >
      <StyleCompletionMark
        done={visualCompleted}
        fillProgress={fillProgress}
        fillTransition={fillTransition}
        pressed={holding}
        className={cn(
          visualCompleted || holding ? "text-primary" : "text-muted-foreground",
          chrome === "plain" ? classes.button : classes.icon
        )}
      />
    </button>
  );
}
