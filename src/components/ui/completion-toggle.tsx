"use client";

import * as React from "react";
import { useUiStyle } from "@/components/brand/ui-style-provider";
import { StyleCompletionMark } from "@/components/ui/style-completion-mark";
import { triggerLightPressFeedback } from "@/lib/feedback/haptics";
import { cn } from "@/lib/utils";

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
  event: React.MouseEvent<HTMLButtonElement>
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
  ...props
}: CompletionToggleProps) {
  const { style } = useUiStyle();
  const OPTIMISTIC_FALLBACK_MS = 8_000;
  const classes = sizeClasses[size];
  const [optimisticCompleted, setOptimisticCompleted] = React.useState<boolean | null>(
    null
  );
  const optimisticBaseStateRef = React.useRef<boolean | null>(null);
  const optimisticTimerRef = React.useRef<number | null>(null);

  const clearOptimisticState = React.useCallback(() => {
    setOptimisticCompleted(null);
    optimisticBaseStateRef.current = null;
    if (optimisticTimerRef.current !== null) {
      window.clearTimeout(optimisticTimerRef.current);
      optimisticTimerRef.current = null;
    }
  }, []);

  React.useEffect(
    () => () => {
      if (optimisticTimerRef.current !== null) {
        window.clearTimeout(optimisticTimerRef.current);
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

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    triggerLightPressFeedback();
    const desiredState = !completed;

    optimisticBaseStateRef.current = completed;
    setOptimisticCompleted(desiredState);
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
  };

  const visualCompleted = optimisticCompleted ?? completed;

  return (
    <button
      type="button"
      data-completed={completed}
      data-visual-completed={visualCompleted}
      data-motion="completion-toggle"
      aria-busy={pending || undefined}
      className={cn(
        "group relative isolate flex shrink-0 touch-manipulation items-center justify-center transition-[transform,box-shadow,background-color,border-color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none",
        chrome === "button" &&
          "border border-border bg-background shadow-sm hover:border-primary hover:bg-primary/5 active:translate-y-0.5 active:scale-[0.94] active:shadow-none",
        chrome === "plain" && "border-0 bg-transparent shadow-none hover:opacity-80",
        chrome === "button" && (style.completionMark === "nest" ? "rounded-md" : "rounded-full"),
        classes.button,
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <StyleCompletionMark
        done={visualCompleted}
        className={cn(visualCompleted ? "text-primary" : "text-muted-foreground", classes.icon)}
      />
    </button>
  );
}
