"use client";

import { CalendarDays } from "lucide-react";

/** Past-session toggle and the cross-goal preview, shared by every layout. */
export function GoalViewControls({
  showPast,
  onShowPastChange,
  onPreview,
}: {
  showPast: boolean;
  onShowPastChange: (showPast: boolean) => void;
  onPreview: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-xs">
      <label className="flex min-h-8 items-center gap-2 text-muted-foreground">
        <input
          type="checkbox"
          checked={showPast}
          onChange={(event) => onShowPastChange(event.target.checked)}
          className="size-4 accent-primary"
        />
        Show past sessions
      </label>
      <button
        type="button"
        onClick={onPreview}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-border px-3 hover:bg-muted"
      >
        <CalendarDays size={15} aria-hidden />
        Preview goals
      </button>
    </div>
  );
}
