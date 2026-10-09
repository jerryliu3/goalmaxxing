"use client";

import { ArrowLeft, ArrowRight, Link2 } from "lucide-react";

export function linkedGoalMarkLabel(outgoing: boolean, incoming: boolean) {
  if (outgoing && incoming) {
    return "Counts toward another goal, and another goal counts toward this";
  }
  if (outgoing) return "Counts toward another goal";
  return "Another goal counts toward this";
}

function MarkGlyph({
  end,
  compact,
}: {
  end: "out" | "in";
  compact: boolean;
}) {
  const iconClass = compact ? "size-3 shrink-0" : "size-3.5 shrink-0";
  const arrowClass = compact ? "size-2 shrink-0" : "size-2.5 shrink-0";
  const Arrow = end === "in" ? ArrowLeft : ArrowRight;
  return (
    <span className="inline-flex items-center">
      <Link2 className={iconClass} aria-hidden />
      <Arrow className={arrowClass} aria-hidden data-plan-link-arrow={end} />
    </span>
  );
}

export function LinkedGoalMarks({
  outgoing,
  incoming,
  pressed = false,
  compact = false,
  className = "",
  onToggle,
}: {
  outgoing: boolean;
  incoming: boolean;
  pressed?: boolean;
  compact?: boolean;
  className?: string;
  onToggle?: () => void;
}) {
  if (!outgoing && !incoming) return null;
  const label = linkedGoalMarkLabel(outgoing, incoming);
  const rowClass = compact ? "flex h-5 items-center" : "flex h-6 items-center";
  const marks = (
    <span className="flex flex-col items-end">
      {outgoing ? (
        <span className={rowClass}>
          <MarkGlyph end="out" compact={compact} />
        </span>
      ) : null}
      {incoming ? (
        <span className={rowClass}>
          <MarkGlyph end="in" compact={compact} />
        </span>
      ) : null}
    </span>
  );
  if (!onToggle) {
    return (
      <span className={`inline-flex shrink-0 items-center text-muted-foreground ${className}`} role="img" aria-label={label} data-plan-link-mark="true">
        {marks}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center text-muted-foreground ${className}`}
      aria-label={label}
      aria-pressed={pressed}
      data-plan-link-mark="true"
      data-plan-completion-hit="true"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
    >
      {marks}
    </button>
  );
}
