import { Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  GOAL_CREATE_KIND_HELP,
  type GoalCreateKind,
} from "@/lib/goals/form-options";
import { CATEGORIES, type DemoGoal, type GoalDraft } from "./model";

type FieldsProps = {
  draft: GoalDraft;
  patch: (next: Partial<GoalDraft>) => void;
  goals: DemoGoal[];
};
export function GoalIntentionFields({ draft: d, patch }: FieldsProps) {
  return (
    <>
      <h3>What would you like to make room for?</h3>
      <label>
        Name
        <input
          autoFocus
          value={d.title}
          placeholder="e.g. Learn to play piano"
          onChange={(e) => patch({ title: e.target.value })}
        />
      </label>
      <fieldset>
        <legend>What kind of thing is it?</legend>
        <div className="il-type-choices">
          {(
            [
              "recurring",
              "fixed_milestones",
              "planner_task",
            ] as GoalCreateKind[]
          ).map((kind) => (
            <button
              type="button"
              key={kind}
              aria-pressed={kind === d.kind}
              onClick={() => patch({ kind })}
            >
              <strong>
                {kind === "recurring"
                  ? "A rhythm"
                  : kind === "fixed_milestones"
                    ? "A set of milestones"
                    : "A one-time task"}
              </strong>
              <span>{GOAL_CREATE_KIND_HELP[kind]}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </>
  );
}
export function GoalShapeFields({ draft: d, patch }: FieldsProps) {
  const reorder = (i: number, direction: number) => {
    const names = d.milestones.split("\n"),
      target = i + direction;
    if (target < 0 || target >= names.length) return;
    [names[i], names[target]] = [names[target], names[i]];
    patch({ milestones: names.join("\n") });
  };
  return (
    <>
      <h3>
        {d.kind === "fixed_milestones"
          ? "Give the steps a shape."
          : d.kind === "planner_task"
            ? "Keep it simple."
            : "Choose a rhythm, not a rigid rule."}
      </h3>
      {d.kind === "recurring" ? (
        <>
          <div className="il-form-grid">
            <label>
              Frequency
              <select
                value={d.interval}
                onChange={(e) =>
                  patch({ interval: e.target.value as GoalDraft["interval"] })
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label>
              Target basis
              <select
                value={d.basis}
                onChange={(e) =>
                  patch({ basis: e.target.value as GoalDraft["basis"] })
                }
              >
                <option value="period">Per period</option>
                <option value="lifetime">Over the goal’s lifetime</option>
              </select>
            </label>
          </div>
          <label>
            Target completions
            <input
              type="number"
              min="1"
              max="99"
              value={d.target}
              onChange={(e) => patch({ target: Number(e.target.value) })}
            />
          </label>
          <p className="il-builder-summary">
            {d.target} completions{" "}
            {d.basis === "lifetime"
              ? "in total"
              : `per ${d.interval === "daily" ? "day" : d.interval === "weekly" ? "week" : "month"}`}
            . You can move the planned occurrences as life changes.
          </p>
        </>
      ) : d.kind === "fixed_milestones" ? (
        <>
          <label>
            Milestones · one per line
            <textarea
              rows={4}
              value={d.milestones}
              onChange={(e) => patch({ milestones: e.target.value })}
            />
          </label>
          <ol className="il-milestone-editor">
            {d.milestones.split("\n").map((name, i, all) => (
              <li key={i}>
                <span>
                  {i + 1}. {name || "Unnamed step"}
                </span>
                <button
                  type="button"
                  className="il-icon"
                  aria-label={`Move milestone ${i + 1} up`}
                  disabled={i === 0}
                  onClick={() => reorder(i, -1)}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  className="il-icon"
                  aria-label={`Move milestone ${i + 1} down`}
                  disabled={i === all.length - 1}
                  onClick={() => reorder(i, 1)}
                >
                  <ChevronDown size={16} />
                </button>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p>
          This is a one-time planner task. It starts in Unplanned, ready to
          place on any date. It does not become a recurring goal.
        </p>
      )}
    </>
  );
}
export function GoalDetailFields({ draft: d, patch, goals }: FieldsProps) {
  if (d.kind === "planner_task")
    return <p>This task will stay in Unplanned until you choose a date.</p>;
  return (
    <>
      <h3>A few details, on your terms.</h3>
      <div className="il-form-grid">
        <label>
          Start date
          <input
            type="date"
            value={d.start}
            onChange={(e) => patch({ start: e.target.value })}
          />
        </label>
        <label>
          End date · optional
          <input
            type="date"
            min={d.start}
            value={d.end}
            onChange={(e) => patch({ end: e.target.value })}
          />
        </label>
      </div>
      <label>
        Category
        <select
          value={d.category}
          onChange={(e) => patch({ category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="il-checkbox-label">
        <input
          type="checkbox"
          checked={d.private}
          onChange={(e) => patch({ private: e.target.checked })}
        />
        Keep this goal private
      </label>
      <details>
        <summary>More options · difficulty, reward, team, linked goal</summary>
        <div className="il-form-grid">
          <label>
            Difficulty
            <select
              value={d.difficulty}
              onChange={(e) =>
                patch({ difficulty: e.target.value as GoalDraft["difficulty"] })
              }
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label>
            Team
            <select
              value={d.team}
              onChange={(e) => patch({ team: e.target.value })}
            >
              <option value="">Personal</option>
              <option>Small Steps Club</option>
            </select>
          </label>
        </div>
        <label>
          Reward
          <input
            value={d.reward}
            onChange={(e) => patch({ reward: e.target.value })}
            placeholder="Something to look forward to"
          />
        </label>
        <label>
          Also credit this goal when completed
          <select
            value={d.linkedTo}
            onChange={(e) => patch({ linkedTo: e.target.value })}
          >
            <option value="">No linked goal</option>
            {goals
              .filter((g) => !g.linkedTo)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
          </select>
        </label>
      </details>
    </>
  );
}
export function GoalDraftPreview({
  draft: d,
  goals,
  live = false,
}: {
  draft: GoalDraft;
  goals: DemoGoal[];
  live?: boolean;
}) {
  return (
    <div className="il-creation-preview">
      <span className="il-eyebrow">
        {live ? "Live preview / " : ""}
        {d.kind === "planner_task" ? "One-time task" : d.category}
      </span>
      <h2>{d.title.trim() || "Your next goal"}</h2>
      <p>
        {d.kind === "recurring"
          ? `${d.target || "—"} completions · ${d.interval} · ${d.basis === "lifetime" ? "lifetime target" : "per period"}`
          : d.kind === "fixed_milestones"
            ? `${d.milestones.split("\n").filter((x) => x.trim()).length} milestones`
            : "One task in Unplanned"}
      </p>
      {d.kind === "fixed_milestones" && (
        <ol>
          {d.milestones
            .split("\n")
            .filter((x) => x.trim())
            .map((n, i) => (
              <li key={i}>{n}</li>
            ))}
        </ol>
      )}
      {d.kind !== "planner_task" && (
        <>
          <p>
            {d.start}
            {d.end ? ` → ${d.end}` : " · No end date"}
          </p>
          <p>
            {d.private ? "Private" : "Visible to your people"} ·{" "}
            {d.team || "Personal"} · {d.difficulty}
            {d.reward ? ` · Reward: ${d.reward}` : ""}
            {d.linkedTo
              ? ` · Also credits ${goals.find((g) => g.id === d.linkedTo)?.title}`
              : ""}
          </p>
        </>
      )}
      {live && (
        <span className="il-blueprint-status">
          <Check size={14} />
          Nothing added until you review and create
        </span>
      )}
    </div>
  );
}
