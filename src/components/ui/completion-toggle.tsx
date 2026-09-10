"use client";

import * as React from "react";
import { useUiStyle } from "@/components/brand/ui-style-provider";
import { StyleCompletionMark } from "@/components/ui/style-completion-mark";
import {
  type CompletionHoldCommitHandler,
  COMPLETION_HOLD_MS,
  useCompletionHold,
} from "@/components/ui/use-completion-hold";
import { cn } from "@/lib/utils";

export { COMPLETION_HOLD_MS };

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

interface CompletionToggleProps
  extends Omit<React.ComponentProps<"button">, "children" | "onClick"> {
  completed: boolean;
  pending?: boolean;
  size?: keyof typeof sizeClasses;
  chrome?: "button" | "plain";
  onClick?: CompletionHoldCommitHandler;
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
  const classes = sizeClasses[size];
  const {
    visualCompleted,
    holding,
    fillTransition,
    fillProgress,
    holdProps,
  } = useCompletionHold({
    completed,
    disabled,
    pending,
    onCommit: onClick,
  });

  return (
    <button
      type="button"
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
      {...props}
      {...holdProps}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        holdProps.onPointerDown(event);
      }}
      onPointerUp={(event) => {
        holdProps.onPointerUp(event);
        onPointerUp?.(event);
      }}
      onPointerLeave={(event) => {
        holdProps.onPointerLeave();
        onPointerLeave?.(event);
      }}
      onPointerCancel={(event) => {
        holdProps.onPointerCancel(event);
        onPointerCancel?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        holdProps.onKeyDown(event);
      }}
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
