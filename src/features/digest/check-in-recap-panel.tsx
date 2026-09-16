"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCompletionMutation } from "@/features/planner/use-completion-mutation";
import { resolveSelectedDateState } from "@/lib/dates/day";
import { resolveUserTimezone } from "@/lib/dates/timezone";
import type {
  DigestFactItem,
  DigestWindowFacts,
} from "@/lib/digest/contract";
import { resolveCompletionDispatch } from "@/lib/planner/completion-dispatch";
import { captureViewportRect } from "@/lib/xp/events";

function itemKey(item: Pick<DigestFactItem, "goalId" | "date">) {
  return `${item.goalId}:${item.date}`;
}

export function CheckInRecapPanel({
  recap,
  localDate,
  onCompleted,
}: {
  recap: DigestWindowFacts;
  localDate: string;
  onCompleted: (item: DigestFactItem) => void;
}) {
  const runCompletionMutation = useCompletionMutation();
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const complete = async (
    item: DigestFactItem,
    sourceElement: HTMLButtonElement
  ) => {
    const key = itemKey(item);
    setSavingKey(key);
    const result = await runCompletionMutation({
      decision: resolveCompletionDispatch({
        requirementKind: "deadline_total",
        targetedRecurring: false,
        activePlanMembership: false,
        matchingItemState: "none",
        selectedDateState: resolveSelectedDateState(item.date, localDate),
        existingExactFact: false,
        desiredFactState: "present",
      }),
      desiredFactState: "present",
      goalId: item.goalId,
      date: item.date,
      timezone: resolveUserTimezone(),
      sourceRect: captureViewportRect(sourceElement),
      fallbackErrorMessage: "The completion could not be updated.",
    });
    setSavingKey(null);
    if (!result.ok) {
      toast.error(result.message ?? "The completion could not be updated.");
      return;
    }
    onCompleted(item);
    toast.success(`${item.title} marked complete for ${item.date}.`);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-lg font-semibold">
          {recap.placed === 0
            ? "Nothing was placed"
            : `${recap.completed} of ${recap.placed} done`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {recap.label}
          {recap.start === recap.end
            ? ` · ${recap.start}`
            : ` · ${recap.start} – ${recap.end}`}
        </p>
      </div>
      {recap.items.length > 0 ? (
        <ul className="space-y-1">
          {recap.items.map((item) => (
            <li
              key={itemKey(item)}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <span className="truncate text-sm">{item.title}</span>
              {item.state === "completed" ? (
                <span className="shrink-0 text-xs text-muted-foreground">
                  Done
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={savingKey !== null}
                  onClick={(event) => void complete(item, event.currentTarget)}
                >
                  {savingKey === itemKey(item) ? "Saving…" : "Mark done"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
