"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { GoalCreationFields } from "@/lib/goals/creation-model";
import type { CardEditorFields } from "./card-editor/card-editor-session";
import { TempoGoalChoices as Choices } from "./tempo-goal-choices";

const FINISH_OPTIONS = [
  { value: "open", label: "Keep it open" },
  { value: "date", label: "Pick a date" },
] as const;

const TIME_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "set", label: "Set a time" },
] as const;

const VISIBILITY_OPTIONS = [
  { value: "friends", label: "Visible to friends" },
  { value: "private", label: "Private" },
] as const;

/**
 * The schedule step as labelled rows: when the goal starts, whether it has a finish, its usual
 * time, and who sees it. The optional facts default to "open" and "any time"; picking the
 * other choice reveals the one input it needs.
 */
export function TempoGoalSchedule({
  id,
  fields,
  onPatch,
  showVisibility,
}: {
  id: string;
  fields: GoalCreationFields;
  onPatch: (patch: Partial<CardEditorFields>) => void;
  showVisibility: boolean;
}) {
  const [finishing, setFinishing] = useState(Boolean(fields.end_date));
  const [timed, setTimed] = useState(Boolean(fields.default_local_time));

  return (
    <div className="tempo-schedule">
      <div className="tempo-schedule-row">
        <label className="tempo-schedule-label" htmlFor={`${id}-start`}>
          Starts
        </label>
        <Input
          id={`${id}-start`}
          type="date"
          required
          value={fields.start_date}
          onChange={(event) => onPatch({ start_date: event.target.value })}
        />
      </div>

      <div className="tempo-schedule-row">
        <p className="tempo-schedule-label">Finish by</p>
        <div className="tempo-schedule-control">
          <Choices
            label="Finish by"
            value={finishing ? "date" : "open"}
            options={FINISH_OPTIONS}
            onChange={(value) => {
              setFinishing(value === "date");
              if (value === "open") onPatch({ end_date: "" });
            }}
          />
          {finishing ? (
            <Input
              id={`${id}-end`}
              aria-label="Finish date"
              type="date"
              autoFocus
              min={fields.start_date}
              value={fields.end_date}
              onChange={(event) => onPatch({ end_date: event.target.value })}
            />
          ) : (
            <p className="tempo-hint">The rhythm keeps going until you end it.</p>
          )}
        </div>
      </div>

      <div className="tempo-schedule-row">
        <p className="tempo-schedule-label">Time of day</p>
        <div className="tempo-schedule-control">
          <Choices
            label="Time of day"
            value={timed ? "set" : "any"}
            options={TIME_OPTIONS}
            onChange={(value) => {
              setTimed(value === "set");
              if (value === "any") onPatch({ default_local_time: "" });
            }}
          />
          {timed ? (
            <Input
              id={`${id}-time`}
              aria-label="Usual time"
              type="time"
              autoFocus
              value={fields.default_local_time}
              onChange={(event) => onPatch({ default_local_time: event.target.value })}
            />
          ) : (
            <p className="tempo-hint">Sessions can land whenever your day allows.</p>
          )}
        </div>
      </div>

      {showVisibility ? (
        <div className="tempo-schedule-row">
          <p className="tempo-schedule-label">Who can see it</p>
          <Choices
            label="Who can see this goal"
            value={fields.is_private ? "private" : "friends"}
            options={VISIBILITY_OPTIONS}
            onChange={(value) => onPatch({ is_private: value === "private" })}
          />
        </div>
      ) : null}
    </div>
  );
}
