"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { clampPlaqueTarget } from "./card-material/creation-plaque-target";

/** The review's action row: the plaque target, the create action, and any blocking error. */
export function TempoGoalCheckpoint({
  plaque,
  disabled,
  action,
  error,
}: {
  /** Absent for tasks, which earn no plaque. */
  plaque?: { target: number; onChange: (target: number) => void };
  disabled?: boolean;
  action: ReactNode;
  error?: string | null;
}) {
  return (
    <div className="tempo-review-action">
      {plaque && (
        <p className="tempo-plaque-copy">
          Your target before earning this achievement plaque will be{" "}
          <label className="tempo-plaque-input">
            <span className="sr-only">Plaque completion target</span>
            <Input
              type="number"
              min={1}
              max={20}
              inputMode="numeric"
              value={plaque.target}
              disabled={disabled}
              onChange={(event) =>
                plaque.onChange(
                  event.target.value === ""
                    ? 1
                    : clampPlaqueTarget(Number(event.target.value)),
                )
              }
            />
          </label>{" "}
          completions.
        </p>
      )}
      {action}
      {error && error !== "Title is required." && (
        <p className="tempo-error" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
