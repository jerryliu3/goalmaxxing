import type { ReactNode } from "react";
import {
  applyGoalCreationFieldChange,
  type GoalCreationFieldChange,
} from "@/lib/goals/creation-model";
import {
  DEFAULT_GOAL_CATEGORIES,
  getCategorySwatchColor,
  type CategorySelection,
} from "@/lib/goals/category";
import {
  GOAL_TYPE_OPTIONS,
  PLANNER_TASK_TYPE_OPTION,
  RECURRENCE_INTERVAL_OPTIONS,
  type GoalCreateKind,
} from "@/lib/goals/form-options";
import { getGoalPeriodTargetMax } from "@/lib/goals/target-basis";
import { type Draft, rhythm } from "./model";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="j-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function GoalFields({
  draft: d,
  setDraft,
  step,
}: {
  draft: Draft;
  setDraft: (draft: Draft) => void;
  step: number;
}) {
  const patch = (value: Partial<Draft>) => setDraft({ ...d, ...value });
  const change = (value: GoalCreationFieldChange) =>
    setDraft(applyGoalCreationFieldChange(d, value));
  const task = d.kind === "planner_task";
  return (
    <div className="j-fields">
      {step === 1 && (
        <>
          <Field label="Goal name">
            <input
              autoComplete="off"
              value={d.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Run a first half marathon"
              required
              maxLength={200}
            />
          </Field>
          <Field label="Category · required">
            <select
              value={d.category_selection}
              onChange={(e) =>
                patch({
                  category_selection: e.target.value as CategorySelection,
                  color: getCategorySwatchColor(
                    e.target.value as CategorySelection,
                  ),
                })
              }
            >
              {DEFAULT_GOAL_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
              <option value="custom">Create a category…</option>
            </select>
          </Field>
          {d.category_selection === "custom" && (
            <Field label="Custom category">
              <input
                value={d.custom_category}
                onChange={(e) => patch({ custom_category: e.target.value })}
                required
              />
            </Field>
          )}
          <Field label="Why this matters · optional">
            <textarea
              value={d.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="A little more energy. A little more belief in myself."
              rows={3}
            />
          </Field>
        </>
      )}
      {step === 2 && (
        <>
          <fieldset className="j-choices">
            <legend>What shape does this take?</legend>
            {[...GOAL_TYPE_OPTIONS, PLANNER_TASK_TYPE_OPTION].map((o) => (
              <button
                type="button"
                key={o.value}
                aria-pressed={d.kind === o.value}
                onClick={() => {
                  const kind = o.value as GoalCreateKind;
                  setDraft({
                    ...(kind === "planner_task"
                      ? d
                      : applyGoalCreationFieldChange(d, {
                          type: "frequency_type",
                          value: kind,
                        })),
                    kind,
                  });
                }}
              >
                <strong>{o.label}</strong>{" "}
                <small>
                  {o.value === "recurring"
                    ? "An action to return to"
                    : o.value === "fixed_milestones"
                      ? "A set of meaningful steps"
                      : "One thing, on one day"}
                </small>
              </button>
            ))}
          </fieldset>
          {task ? (
            <p className="j-note">
              Tasks go to Planner → Tasks. They do not become recurring goals.
            </p>
          ) : d.kind === "recurring" ? (
            <>
              <Field label="Frequency">
                <select
                  value={d.recurrence_interval}
                  onChange={(e) =>
                    change({
                      type: "recurrence_interval",
                      value: e.target.value as Draft["recurrence_interval"],
                    })
                  }
                >
                  {RECURRENCE_INTERVAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Measure the target">
                <select
                  value={d.target_basis}
                  onChange={(e) =>
                    change({
                      type: "target_basis",
                      value: e.target.value as Draft["target_basis"],
                    })
                  }
                >
                  <option value="period">Days per period</option>
                  <option value="lifetime">
                    Total completions over the goal
                  </option>
                </select>
              </Field>
              <Field
                label={
                  d.target_basis === "lifetime"
                    ? "Total completions"
                    : `Days per ${d.recurrence_interval === "daily" ? "day" : d.recurrence_interval === "weekly" ? "week" : "month"}`
                }
                hint={
                  d.target_basis === "period"
                    ? "Count distinct days. Choose the exact dates later in your plan."
                    : "Each completion counts independently toward this total."
                }
              >
                <input
                  type="number"
                  min={1}
                  max={
                    d.target_basis === "period"
                      ? getGoalPeriodTargetMax(d.recurrence_interval)
                      : undefined
                  }
                  value={d.target_count}
                  onChange={(e) =>
                    change({ type: "target_count", value: e.target.value })
                  }
                  required
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Number of milestones">
                <input
                  type="number"
                  min={1}
                  value={d.target_count}
                  onChange={(e) =>
                    change({ type: "target_count", value: e.target.value })
                  }
                  required
                />
              </Field>
              <details>
                <summary>Name the milestones · optional</summary>
                <div className="j-fields">
                  {d.milestone_names.map((name, i) => (
                    <Field key={i} label={`Milestone ${i + 1}`}>
                      <input
                        value={name}
                        placeholder={`Step ${i + 1}`}
                        onChange={(e) =>
                          change({
                            type: "milestone_name",
                            index: i,
                            value: e.target.value,
                          })
                        }
                      />
                    </Field>
                  ))}
                </div>
              </details>
            </>
          )}
        </>
      )}
      {step === 3 && (
        <>
          {task ? (
            <Field label="Task date">
              <input
                type="date"
                value={d.task_scheduled_date}
                required
                onChange={(e) => patch({ task_scheduled_date: e.target.value })}
              />
            </Field>
          ) : (
            <>
              <Field
                label={
                  d.kind === "fixed_milestones" || d.target_basis === "lifetime"
                    ? "Completion date · optional"
                    : "End date · optional"
                }
                hint="Leave blank to keep the goal open-ended."
              >
                <input
                  type="date"
                  value={d.end_date}
                  min={d.start_date}
                  onChange={(e) => patch({ end_date: e.target.value })}
                />
              </Field>
              <details>
                <summary>Starts {d.start_date} · change start date</summary>
                <Field label="Start date">
                  <input
                    type="date"
                    value={d.start_date}
                    required
                    onChange={(e) => patch({ start_date: e.target.value })}
                  />
                </Field>
              </details>
            </>
          )}
          <details>
            <summary>
              Time of day ·{" "}
              {task
                ? d.task_scheduled_time || "any time"
                : d.default_local_time || "any time"}
            </summary>
            <Field
              label="Time of day · optional"
              hint="A scheduling preference. No duration or time-spent target."
            >
              <input
                type="time"
                value={task ? d.task_scheduled_time : d.default_local_time}
                onChange={(e) =>
                  patch(
                    task
                      ? { task_scheduled_time: e.target.value }
                      : { default_local_time: e.target.value },
                  )
                }
              />
            </Field>
            <button
              className="j-text"
              type="button"
              onClick={() =>
                patch(
                  task
                    ? { task_scheduled_time: "" }
                    : { default_local_time: "" },
                )
              }
            >
              Clear time
            </button>
          </details>
          {!task && (
            <details>
              <summary>
                Advanced settings · difficulty, privacy, links & more
              </summary>
              <div className="j-fields">
                <Field label="Difficulty">
                  <select
                    value={d.difficulty}
                    onChange={(e) =>
                      patch({
                        difficulty: e.target.value as Draft["difficulty"],
                      })
                    }
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </Field>
                <Field
                  label="Link to a main goal"
                  hint="A subgoal completion also advances its main goal. The score proposal counts the underlying effort once."
                >
                  <select
                    value={d.linked_target_goal_id}
                    disabled={!!d.team_id}
                    onChange={(e) =>
                      patch({ linked_target_goal_id: e.target.value })
                    }
                  >
                    <option value="none">No linked goal</option>
                    <option value="health">Build a healthier life</option>
                    <option value="career">Make work I am proud of</option>
                  </select>
                </Field>
                <Field label="Team">
                  <select
                    value={d.team_id ?? ""}
                    onChange={(e) =>
                      patch({
                        team_id: e.target.value || null,
                        ...(e.target.value
                          ? { is_private: false, linked_target_goal_id: "none" }
                          : {}),
                      })
                    }
                  >
                    <option value="">Personal goal</option>
                    <option value="weekenders">
                      The Weekenders · sample team
                    </option>
                  </select>
                </Field>
                <label className="j-check">
                  <input
                    type="checkbox"
                    checked={d.is_private}
                    disabled={!!d.team_id}
                    onChange={(e) => patch({ is_private: e.target.checked })}
                  />
                  Make this goal private
                </label>
                {d.team_id && (
                  <small>
                    Team goals are visible to the team; personal goal linking is
                    unavailable.
                  </small>
                )}
                <Field label="Goal color">
                  <input
                    type="color"
                    value={d.color}
                    onChange={(e) => patch({ color: e.target.value })}
                  />
                </Field>
                <Field label="Achievement reward · optional">
                  <input
                    maxLength={500}
                    value={d.reward_text}
                    onChange={(e) => patch({ reward_text: e.target.value })}
                    placeholder="A weekend by the coast"
                  />
                </Field>
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
export function DraftReceipt({ draft: d }: { draft: Draft }) {
  return (
    <dl className="j-receipt">
      <div>
        <dt>Intention</dt>
        <dd>{d.title || "Your next goal"}</dd>
      </div>
      <div>
        <dt>Category</dt>
        <dd>
          {d.category_selection === "custom"
            ? d.custom_category || "Choose a name"
            : d.category_selection}
        </dd>
      </div>
      <div>
        <dt>Shape</dt>
        <dd>{rhythm(d)}</dd>
      </div>
      <div>
        <dt>When</dt>
        <dd>
          {d.kind === "planner_task"
            ? `${d.task_scheduled_date} · ${d.task_scheduled_time || "Any time"}`
            : `${d.start_date} → ${d.end_date || "Open-ended"} · ${d.default_local_time || "Any time"}`}
        </dd>
      </div>
      {d.kind !== "planner_task" && (
        <>
          <div>
            <dt>Settings</dt>
            <dd>
              {d.difficulty} ·{" "}
              {d.team_id
                ? "The Weekenders"
                : d.is_private
                  ? "Private"
                  : "Visible to others"}{" "}
              · <span style={{ color: d.color }}>●</span> {d.color}
            </dd>
          </div>
          {d.linked_target_goal_id !== "none" && (
            <div>
              <dt>Linked to</dt>
              <dd>
                {d.linked_target_goal_id === "health"
                  ? "Build a healthier life"
                  : "Make work I am proud of"}
              </dd>
            </div>
          )}
          {d.milestone_names.some(Boolean) && (
            <div>
              <dt>Milestones</dt>
              <dd>
                {d.milestone_names
                  .map((x, i) => x || `Step ${i + 1}`)
                  .join(" → ")}
              </dd>
            </div>
          )}
          {d.reward_text && (
            <div>
              <dt>Reward</dt>
              <dd>{d.reward_text}</dd>
            </div>
          )}
        </>
      )}
      {d.description && (
        <div>
          <dt>Why</dt>
          <dd>{d.description}</dd>
        </div>
      )}
    </dl>
  );
}
