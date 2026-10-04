"use client";

import type { Goal } from "@/lib/goals/types";
import { cn } from "@/lib/utils";

/** A native range control gives the dotted track touch, mouse and keyboard input. */
export function GoalDotScrollbar({ goals, position, onSeek, onStart, onEnd }: {
  goals: Goal[];
  position: number;
  onSeek: (position: number) => void;
  onStart: () => void;
  onEnd: () => void;
}) {
  const index = Math.max(0, Math.min(goals.length - 1, Math.round(position)));
  return (
    <div
      className="relative mx-auto flex min-h-11 max-w-full items-center rounded-lg focus-within:ring-2 focus-within:ring-ring"
      style={{ width: goals.length * 28 }}
    >
      <div aria-hidden="true" className="pointer-events-none flex w-full">
        {goals.map((goal, dotIndex) => (
          <span key={goal.id} className="grid min-w-0 flex-1 place-items-center">
            <span className={cn(
              "h-1.5 rounded-full bg-border",
              dotIndex === index ? "w-4 bg-primary" : "w-1.5"
            )} />
          </span>
        ))}
      </div>
      <input
        type="range"
        aria-label="Browse goals"
        aria-valuetext={`${goals[index]?.title ?? "Goal"}, goal ${index + 1} of ${goals.length}`}
        min={0}
        max={Math.max(0, goals.length - 1)}
        step="any"
        value={position}
        disabled={goals.length < 2}
        onChange={event => onSeek(Number(event.currentTarget.value))}
        onPointerDown={onStart}
        onPointerUp={onEnd}
        onPointerCancel={onEnd}
        onKeyUp={event => {
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) onEnd();
        }}
        className="absolute inset-0 m-0 h-full w-full touch-none cursor-ew-resize opacity-0 disabled:cursor-default"
      />
    </div>
  );
}
