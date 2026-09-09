"use client";

import { ArrowUp } from "lucide-react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { StyleCompletionMark } from "@/components/ui/style-completion-mark";
import { cn } from "@/lib/utils";

export type PlanLedgerCompletionMode = "toggle" | "done" | "hidden" | "move";

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
  if (mode === "move") {
    return (
      <button
        type="button"
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary",
          pending && "opacity-60"
        )}
        disabled={disabled || pending}
        aria-label={`Move a planned session to complete ${label}`}
        onClick={(event) => onToggle(event.currentTarget)}
      >
        <ArrowUp className="size-3.5" aria-hidden />
      </button>
    );
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
