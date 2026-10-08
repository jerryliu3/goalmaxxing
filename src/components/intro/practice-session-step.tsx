"use client";

import { CompletionToggle } from "@/components/ui/completion-toggle";
import { startCompletionMotion } from "@/lib/feedback/completion-motion";
import { captureViewportRect } from "@/lib/xp/events";

export function PracticeSessionStep({
  completed,
  onComplete,
  label = "Complete practice session",
  title = "Take a moment to breathe",
}: {
  completed: boolean;
  onComplete: () => void;
  label?: string;
  title?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className={completed ? "pointer-events-none" : undefined}>
        <CompletionToggle
          completed={completed}
          size="sm"
          chrome="plain"
          aria-label={label}
          onClick={(_event, source) => {
            if (source) startCompletionMotion(captureViewportRect(source));
            onComplete();
          }}
        />
      </div>
      <p className="type-item text-sm">{title}</p>
    </div>
  );
}
