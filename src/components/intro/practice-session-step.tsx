"use client";

import { CompletionToggle } from "@/components/ui/completion-toggle";

export function PracticeSessionStep({ completed, onComplete }: { completed: boolean; onComplete: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className={completed ? "pointer-events-none" : undefined}>
        <CompletionToggle
          completed={completed}
          size="sm"
          chrome="plain"
          aria-label="Complete practice session"
          onClick={onComplete}
        />
      </div>
      <p className="type-item text-sm">Take a moment to breathe</p>
    </div>
  );
}
