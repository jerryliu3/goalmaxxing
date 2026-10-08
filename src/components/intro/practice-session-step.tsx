"use client";

import { CompletionToggle } from "@/components/ui/completion-toggle";

export function PracticeSessionStep({ completed, onComplete }: { completed: boolean; onComplete: () => void }) {
  return <div className="space-y-4">
    <p className="text-muted-foreground">Press and hold the circle until the ring closes. The filled circle confirms completion. Keyboard users can press Space or Enter.</p>
    <div className="flex items-center gap-4 border-y py-6">
      <CompletionToggle completed={completed} size="lg" chrome="plain" disabled={completed}
        aria-label="Complete practice session" onClick={onComplete} />
      <div><p className="type-item">Take a moment to breathe</p><p className="text-sm text-muted-foreground">Practice session</p></div>
    </div>
    <p role="status" className="text-sm text-muted-foreground">{completed ? "Session complete. That’s all it takes." : "Keep holding until the circle fills. Releasing early cancels."}</p>
  </div>;
}
