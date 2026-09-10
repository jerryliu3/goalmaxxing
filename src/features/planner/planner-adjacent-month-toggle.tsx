"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlannerAdjacentMonthToggle({
  direction,
  shown,
  onToggle,
}: {
  direction: "previous" | "next";
  shown: boolean;
  onToggle: () => void;
}) {
  const label =
    direction === "previous"
      ? shown
        ? "Hide previous month"
        : "Show previous month"
      : shown
        ? "Hide next month"
        : "Show next month";
  const Icon = direction === "previous" ? ChevronUp : ChevronDown;
  return (
    <div className={direction === "previous" ? "mb-1" : "mt-1"}>
      <button
        type="button"
        className="flex w-full items-center justify-center gap-1 py-0.5 text-[11px] font-sans text-muted-foreground/70 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 touch-manipulation"
        aria-pressed={shown}
        onClick={onToggle}
      >
        <Icon
          className={cn(
            "size-3",
            direction === "previous"
              ? "plan-adjacent-month-nudge-up"
              : "plan-adjacent-month-nudge-down"
          )}
          aria-hidden
        />
        {label}
      </button>
    </div>
  );
}
