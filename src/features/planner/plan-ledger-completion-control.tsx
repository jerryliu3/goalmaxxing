"use client";

import { CompletionToggle } from "@/components/ui/completion-toggle";
import { StyleCompletionMark } from "@/components/ui/style-completion-mark";

export type PlanLedgerCompletionMode = "toggle" | "done" | "hidden";

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
  mode: PlanLedgerCompletionMode;
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
      disabled={disabled}
      aria-label={completed ? `Mark ${label} not done` : `Mark ${label} done`}
    />
  );
}
