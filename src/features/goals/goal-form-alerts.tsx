"use client";

import { Button } from "@/components/ui/button";

export function GoalFormRecoveryAlert({
  kind,
  saving,
  onRetry,
}: {
  kind: "link" | "update" | "create";
  saving: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p>
        {kind === "link"
          ? "The goal was saved, but its selected link was not. Retry to finish saving it."
          : kind === "update"
            ? "The goal update could not be confirmed. Retry to safely reconcile it."
            : "Goal creation could not be confirmed. Retry to safely reconcile this draft."}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={onRetry}
        disabled={saving}
      >
        {kind === "link"
          ? "Retry saving link"
          : kind === "update"
            ? "Retry saving goal"
            : "Retry creating goal"}
      </Button>
    </div>
  );
}

export function GoalFormLinkTargetsErrorAlert({
  message,
  loading,
  saving,
  hasRecovery,
  onRetry,
}: {
  message: string;
  loading: boolean;
  saving: boolean;
  hasRecovery: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p>{message}</p>
      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={onRetry}
        disabled={loading || saving || hasRecovery}
      >
        Retry loading link targets
      </Button>
    </div>
  );
}
