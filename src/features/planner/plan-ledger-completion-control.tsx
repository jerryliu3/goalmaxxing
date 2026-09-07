"use client";

import { CompletionToggle } from "@/components/ui/completion-toggle";
import { StyleCompletionMark } from "@/components/ui/style-completion-mark";

export function PlanLedgerCompletionControl({
  completed,
  pending,
  mode,
  label,
  disabled = false,
  onToggle,
}: {
  completed: boolean;
  pending: boolean;
  mode: "toggle" | "done" | "hidden";
  label: string;
  disabled?: boolean;
  onToggle: (sourceElement: HTMLButtonElement) => void;
}) {
  if (mode === "hidden") {
    return null;
  }
  if (mode === "done") {
    return <StyleCompletionMark done className="size-6 shrink-0" label="Completed" />;
  }
  return (
    <CompletionToggle
      completed={completed}
      pending={pending}
      size="sm"
      chrome="plain"
      onClick={(event) => {
        if (
          "currentTarget" in event &&
          event.currentTarget instanceof HTMLButtonElement
        ) {
          onToggle(event.currentTarget);
        }
      }}
      disabled={disabled || pending}
      aria-label={completed ? `Mark ${label} not done` : `Mark ${label} done`}
    />
  );
}
