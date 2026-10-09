"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * The review checkpoint: everything the goal needs is set, so it can be created here. The
 * optional details (and the plaque target) come after, through "Add more details".
 */
export function TempoGoalCheckpoint({
  plaqueTarget,
  disabled,
  action,
  onDetails,
  error,
}: {
  /** Absent for tasks, which earn no plaque. */
  plaqueTarget?: number;
  disabled?: boolean;
  action: ReactNode;
  /** Absent for tasks, which have no optional details. */
  onDetails?: () => void;
  error?: string | null;
}) {
  return (
    <div className="tempo-review-action">
      {plaqueTarget !== undefined && (
        <p className="tempo-plaque-copy">
          You’ll earn this achievement plaque after{" "}
          <strong>{plaqueTarget}</strong>{" "}
          {plaqueTarget === 1 ? "completion" : "completions"}.
        </p>
      )}
      {action}
      {onDetails && (
        <Button type="button" variant="ghost" disabled={disabled} onClick={onDetails}>
          Add more details <small className="tempo-optional">(optional)</small> →
        </Button>
      )}
      {error && error !== "Title is required." && (
        <p className="tempo-error" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
