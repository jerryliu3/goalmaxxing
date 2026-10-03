"use client";

import { motion, useReducedMotion } from "motion/react";
import { Input } from "@/components/ui/input";
import { getGoalCreationPeriodTargetMax } from "@/lib/goals/creation-model";
import type { GoalCreateKind } from "@/lib/goals/form-options";
import type { GoalCreationFieldControlsProps } from "./goal-creation-fields";
import type { TempoChoicesMade } from "./tempo-creation-progress";
import { TempoMilestoneRope } from "./tempo-milestone-rope";
import { TempoGoalChoices as Choices } from "./tempo-goal-choices";

export function TempoGoalRhythm({
  fields,
  onFieldChange,
  createKind,
  onCreateKindChange,
  includePlannerTask,
  isPlannerTask,
  chosen,
  onChosen,
}: Pick<
  GoalCreationFieldControlsProps,
  | "fields"
  | "onFieldChange"
  | "createKind"
  | "onCreateKindChange"
  | "includePlannerTask"
  | "isPlannerTask"
> & {
  chosen: TempoChoicesMade;
  onChosen: (patch: Partial<TempoChoicesMade>) => void;
}) {
  const reducedMotion = useReducedMotion();
  const milestones = fields.frequency_type === "fixed_milestones";
  const count = chosen.count ? Number(fields.target_count) || 0 : 0;
  const max = getGoalCreationPeriodTargetMax(fields.recurrence_interval);
  const changeCount = (value: string) => {
    onChosen({ count: value.length > 0 });
    onFieldChange({ type: "target_count", value });
  };
  return (
    <>
      <Choices<GoalCreateKind>
        label="Goal type"
        value={chosen.kind ? createKind : null}
        options={[
          { value: "recurring", label: "↻ A repeating rhythm" },
          { value: "fixed_milestones", label: "↗ A milestone journey" },
          ...(includePlannerTask
            ? [{ value: "planner_task" as const, label: "✓ A single task" }]
            : []),
        ]}
        onChange={(value) => {
          if (chosen.kind && value === createKind) return;
          onCreateKindChange(value);
          if (value === "fixed_milestones")
            onFieldChange({ type: "target_count", value: "1" });
          onChosen({
            kind: true,
            interval: false,
            basis: false,
            count: value === "fixed_milestones",
          });
        }}
      />
      {chosen.kind &&
        (isPlannerTask ? (
          <p>A single action, on a day you choose.</p>
        ) : milestones ? (
          <TempoMilestoneRope
            count={count}
            names={fields.milestone_names}
            onCount={changeCount}
            onName={(index, value) =>
              onFieldChange({ type: "milestone_name", index, value })
            }
          />
        ) : (
          <>
            <Choices
              label="Frequency"
              value={chosen.interval ? fields.recurrence_interval : null}
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
              ]}
              onChange={(value) => {
                if (chosen.interval && value === fields.recurrence_interval)
                  return;
                onFieldChange({ type: "recurrence_interval", value });
                onFieldChange({ type: "target_basis", value: "period" });
                if (value === "daily")
                  onFieldChange({ type: "target_count", value: "1" });
                onChosen({
                  interval: true,
                  basis: true,
                  count: value === "daily",
                });
              }}
            />
            {chosen.interval && (
              <Choices
                label="Target basis"
                value={chosen.basis ? fields.target_basis : null}
                options={[
                  { value: "period", label: "Each period" },
                  { value: "lifetime", label: "In total" },
                ]}
                onChange={(value) => {
                  if (chosen.basis && value === fields.target_basis) return;
                  onFieldChange({ type: "target_basis", value });
                  const daily =
                    value === "period" &&
                    fields.recurrence_interval === "daily";
                  if (daily)
                    onFieldChange({ type: "target_count", value: "1" });
                  onChosen({ basis: true, count: daily });
                }}
              />
            )}
            {chosen.interval &&
              chosen.basis &&
              (fields.target_basis === "period" ? (
                fields.recurrence_interval === "daily" ? (
                  <p className="tempo-hint">
                    Daily. One small commitment, each day.
                  </p>
                ) : (
                  <div>
                    <p className="tempo-count">
                      <strong>{count || "—"}</strong>{" "}
                      {count === 1 ? "day" : "days"} /{" "}
                      {fields.recurrence_interval === "weekly"
                        ? "week"
                        : "month"}
                    </p>
                    <div
                      className="tempo-beats"
                      style={{
                        gridTemplateColumns: `repeat(${Math.min(max, 7)}, minmax(0, 1fr))`,
                      }}
                      role="group"
                      aria-label="Days per period"
                    >
                      {Array.from({ length: max }, (_, index) => (
                        <motion.button
                          type="button"
                          key={index}
                          aria-label={`${index + 1} ${index === 0 ? "day" : "days"} per period`}
                          aria-pressed={count === index + 1}
                          data-filled={index < count}
                          whileTap={
                            reducedMotion
                              ? undefined
                              : { scale: 0.83, rotateX: 20 }
                          }
                          animate={
                            reducedMotion
                              ? undefined
                              : { y: index < count ? -3 : 0 }
                          }
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 18,
                          }}
                          onClick={() => changeCount(String(index + 1))}
                        >
                          {index + 1}
                        </motion.button>
                      ))}
                    </div>
                    <p className="tempo-hint">
                      Tap a bead to choose how many days. You’ll place them in
                      your plan later.
                    </p>
                  </div>
                )
              ) : (
                <label>
                  Total target completions
                  <Input
                    type="number"
                    min="1"
                    value={chosen.count ? fields.target_count : ""}
                    onChange={(event) => changeCount(event.target.value)}
                  />
                </label>
              ))}
          </>
        ))}
    </>
  );
}
