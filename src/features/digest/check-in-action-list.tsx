"use client";

import { Button } from "@/components/ui/button";
import type { CheckInRow } from "@/features/digest/check-in-actions";
import { digestActionHref, recoveryReviewHref } from "@/features/digest/digest-api";

function actionLabel(entry: CheckInRow) {
  if (entry.id === "recover") return "Review";
  if (entry.id === "unscheduled") return "Schedule goals";
  if (entry.id === "new-goals" || entry.action === "goals") return "Add goal";
  if (entry.action === "today") return "View today";
  if (entry.action === "progress") return "View progress";
  return "Review plan";
}

export function CheckInRowList({
  rows,
  hrefPrefix,
  onNavigate,
  emptyMessage,
}: {
  rows: CheckInRow[];
  hrefPrefix: string;
  onNavigate: (href: string | null) => void;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return emptyMessage ? (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    ) : null;
  }

  return (
    <ul className="space-y-2">
      {rows.map((entry) => {
        const href =
          entry.id === "recover"
            ? recoveryReviewHref(hrefPrefix)
            : digestActionHref(entry.action, hrefPrefix);
        return (
          <li key={entry.id} className="rounded-lg border p-3">
            <p className="type-item text-sm">{entry.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{entry.detail}</p>
            {href ? (
              <Button
                type="button"
                variant="link"
                className="h-auto px-0"
                onClick={() => onNavigate(href)}
              >
                {actionLabel(entry)}
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
