"use client";

import { useUiStyle } from "@/components/brand/ui-style-provider";
import { NestCompletionMark } from "@/components/ui/nest-completion-mark";
import { cn } from "@/lib/utils";

export function StyleCompletionMark({
  done,
  fillProgress = done ? 1 : 0,
  fillTransition = false,
  className,
  label,
}: {
  done: boolean;
  fillProgress?: number;
  fillTransition?: boolean;
  className?: string;
  label?: string;
}) {
  const { style } = useUiStyle();
  const progress = Math.min(1, Math.max(0, fillProgress));

  if (style.completionMark === "nest") {
    return (
      <NestCompletionMark
        done={done}
        fillProgress={progress}
        fillTransition={fillTransition}
        className={className}
        label={label}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      data-completion-mark="circle"
      data-completed={done ? "true" : "false"}
      data-fill-progress={progress}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="5.2"
        fill="currentColor"
        style={{
          transform: `scale(${progress})`,
          transformOrigin: "12px 12px",
          transition: fillTransition
            ? "transform var(--motion-duration-hold, 480ms) linear"
            : "none",
        }}
      />
    </svg>
  );
}
