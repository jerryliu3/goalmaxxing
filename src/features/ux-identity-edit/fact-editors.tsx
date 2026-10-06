"use client";

import { endOfMonth, endOfYear, format } from "date-fns";
import { Archive, Lock, Minus, Plus, Trash2, Undo2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { TempoGoalChoices as Choices } from "@/features/goals/tempo-goal-choices";
import {
  DEFAULT_GOAL_CATEGORIES,
  type CategorySelection,
} from "@/lib/goals/category";
import type { GoalDifficulty } from "@/lib/goals/types";
import {
  cadenceBounds,
  cadenceCountEditable,
  categoryPatch,
  formatDate,
  isMilestoneGoal,
  lockedRhythmLabel,
  type EditFact,
} from "./edit-model";
import { ColourPicker } from "./colour-picker";
import type { EditSession } from "./use-edit-session";
import "@/features/goals/tempo-goal-creation.css";

const SAMPLE_TODAY = new Date(2026, 9, 2);

/**
 * One control per fact, styled with the creation flow's chips and beads.
 * Every concept composes these; only the arrangement differs.
 */
export function FactEditor({ fact, session }: { fact: EditFact; session: EditSession }) {
  const { fields, patch } = session;
  switch (fact) {
    case "name":
      return (
        <input
          className="ie-name-input"
          aria-label="Goal name"
          value={fields.title}
          onChange={(event) => patch({ title: event.target.value })}
        />
      );
    case "category":
      return (
        <Choices
          label="Category"
          value={fields.category_selection}
          options={DEFAULT_GOAL_CATEGORIES.map((category) => ({
            value: category.key as CategorySelection,
            label: category.label,
            color: category.color,
          }))}
          onChange={(value) => patch(categoryPatch(fields, value))}
        />
      );
    case "stretch":
      return (
        <Choices<GoalDifficulty>
          label="Difficulty"
          value={fields.difficulty}
          options={[
            { value: "easy", label: "Easy · a little lift" },
            { value: "medium", label: "Medium · a good push" },
            { value: "hard", label: "Hard · a big stretch" },
          ]}
          onChange={(difficulty) => patch({ difficulty })}
        />
      );
    case "cadence":
      return <CadenceEditor session={session} />;
    case "deadline":
      return (
        <div className="ie-stack">
          <input
            type="date"
            className="ie-input"
            aria-label="Deadline"
            min={fields.start_date}
            value={fields.end_date}
            onChange={(event) => patch({ end_date: event.target.value })}
          />
          <div className="ie-quick">
            <button type="button" onClick={() => patch({ end_date: format(endOfMonth(SAMPLE_TODAY), "yyyy-MM-dd") })}>
              End of month
            </button>
            <button type="button" onClick={() => patch({ end_date: format(endOfYear(SAMPLE_TODAY), "yyyy-MM-dd") })}>
              End of year
            </button>
            <button type="button" aria-pressed={!fields.end_date} onClick={() => patch({ end_date: "" })}>
              No deadline
            </button>
          </div>
          <p className="tempo-hint">Started {formatDate(fields.start_date)}. The start date stays where it began.</p>
        </div>
      );
    case "time":
      return (
        <div className="ie-row-controls">
          <input
            type="time"
            step={300}
            className="ie-input"
            aria-label="Time of day"
            value={fields.default_local_time}
            onChange={(event) => patch({ default_local_time: event.target.value })}
          />
          <div className="ie-quick">
            <button type="button" aria-pressed={!fields.default_local_time} onClick={() => patch({ default_local_time: "" })}>
              Any time
            </button>
          </div>
        </div>
      );
    case "visibility":
      return (
        <Choices
          label="Visibility"
          value={fields.is_private ? "private" : "visible"}
          options={[
            { value: "visible", label: "Visible to friends" },
            { value: "private", label: "Private (except for team)" },
          ]}
          onChange={(value) => patch({ is_private: value === "private" })}
        />
      );
    case "link":
      return (
        <div className="ie-stack">
          <Choices
            label="Counts toward"
            value={fields.linked_target_goal_id}
            options={[
              { value: "none", label: "Just this goal" },
              ...session.linkOptions.map((option) => ({ value: option.id, label: option.title })),
            ]}
            onChange={(value) => patch({ linked_target_goal_id: value })}
          />
          <p className="tempo-hint">Each session you complete here also counts for the goal you pick, that day.</p>
        </div>
      );
    case "milestones":
      return (
        <ol className="ie-milestones">
          {Array.from({ length: Number(fields.target_count) || 0 }, (_, index) => (
            <li key={index}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <input
                aria-label={`Milestone ${index + 1} name`}
                placeholder={`Milestone ${index + 1}`}
                value={fields.milestone_names[index] ?? ""}
                disabled={index < session.completed}
                onChange={(event) => session.setMilestoneName(index, event.target.value)}
              />
              {index < session.completed && <small>Done</small>}
            </li>
          ))}
        </ol>
      );
    case "description":
      return (
        <textarea
          className="ie-textarea"
          aria-label="Intention"
          rows={3}
          placeholder="Why this matters to you — a line for future you."
          value={fields.description}
          onChange={(event) => patch({ description: event.target.value })}
        />
      );
    case "reward":
      return (
        <input
          className="ie-input ie-input-wide"
          aria-label="Reward"
          placeholder="Something to look forward to when you finish"
          value={fields.reward_text}
          onChange={(event) => patch({ reward_text: event.target.value })}
        />
      );
    case "plaque": {
      const target = Number(fields.plaque_target) || 1;
      const set = (value: number) => patch({ plaque_target: String(Math.max(1, Math.min(20, value))) });
      return (
        <div className="ie-stack">
          <div className="ie-stepper">
            <button type="button" aria-label="Fewer" disabled={target <= 1} onClick={() => set(target - 1)}><Minus size={16} /></button>
            <strong aria-live="polite">{target}</strong>
            <span>completions to earn the plaque</span>
            <button type="button" aria-label="More" disabled={target >= 20} onClick={() => set(target + 1)}><Plus size={16} /></button>
          </div>
        </div>
      );
    }
    case "color":
      return <ColourPicker session={session} />;
  }
}

function CadenceEditor({ session }: { session: EditSession }) {
  const { fields, patch, completed } = session;
  const count = Number(fields.target_count) || 0;
  const { min, max } = cadenceBounds(fields, completed);
  const perPeriod = fields.frequency_type === "recurring" && fields.target_basis === "period";
  const lock = (
    <p className="ie-locked">
      <Lock size={12} aria-hidden="true" />
      {lockedRhythmLabel(fields)} · set when you created it
    </p>
  );
  if (!cadenceCountEditable(fields)) {
    return (
      <div className="ie-stack">
        {lock}
        <p className="tempo-hint">Every day — one small commitment, each day. Nothing to tune here.</p>
      </div>
    );
  }
  if (perPeriod) {
    return (
      <div className="ie-stack">
        {lock}
        <div
          className="tempo-beats"
          style={{ gridTemplateColumns: `repeat(${Math.min(max, 7)}, minmax(0, 1fr))` }}
          role="group"
          aria-label="Days per period"
        >
          {Array.from({ length: max }, (_, index) => (
            <button
              type="button"
              key={index}
              aria-label={`${index + 1} ${index === 0 ? "day" : "days"}`}
              aria-pressed={count === index + 1}
              data-filled={index < count}
              onClick={() => patch({ target_count: String(index + 1) })}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }
  const set = (value: number) => {
    const next = Math.max(min, Math.min(max, value));
    patch({
      target_count: String(next),
      ...(isMilestoneGoal(fields)
        ? { milestone_names: fields.milestone_names.slice(0, next) }
        : {}),
    });
  };
  return (
    <div className="ie-stack">
      {lock}
      <div className="ie-stepper">
        <button type="button" aria-label="Fewer" disabled={count <= min} onClick={() => set(count - 1)}>
          <Minus size={16} />
        </button>
        <strong aria-live="polite">{count}</strong>
        <span>{isMilestoneGoal(fields) ? "milestones" : "sessions in total"}</span>
        <button type="button" aria-label="More" disabled={count >= max} onClick={() => set(count + 1)}>
          <Plus size={16} />
        </button>
      </div>
      <p className="tempo-hint">
        {completed} already done, so the target can’t go below {min}.
      </p>
    </div>
  );
}

/** Archive/restore and a two-step delete. Delete is the only irreversible action, so it confirms in place. */
export function GoalLifecycleActions({ session, layout = "inline" }: { session: EditSession; layout?: "inline" | "rows" }) {
  const [confirming, setConfirming] = useState(false);
  const archived = session.lifecycle === "archived";
  if (confirming) {
    return (
      <div className="ie-confirm" role="alertdialog" aria-label="Delete goal">
        <p>
          <strong>Delete “{session.fields.title}”?</strong> Its {session.completed} completions and plan go with it.
        </p>
        <div>
          <button type="button" className="ie-button" onClick={() => setConfirming(false)}>
            Keep it
          </button>
          <button
            type="button"
            className="ie-button ie-danger"
            onClick={() => {
              setConfirming(false);
              session.setLifecycle("deleted");
            }}
          >
            Delete goal
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="ie-lifecycle" data-layout={layout}>
      <button type="button" onClick={() => session.setLifecycle(archived ? "active" : "archived")}>
        {archived ? <Undo2 size={15} /> : <Archive size={15} />}
        <span>
          {archived ? "Restore goal" : "Archive goal"}
          {layout === "rows" && <small>{archived ? "Bring it back into your plan." : "Hide it from your plan. Keep its history."}</small>}
        </span>
      </button>
      <button type="button" className="ie-delete" onClick={() => setConfirming(true)}>
        <Trash2 size={15} />
        <span>
          Delete goal
          {layout === "rows" && <small>Remove it and its history for good.</small>}
        </span>
      </button>
    </div>
  );
}

/** Smoothly reveals its content by animating grid rows from 0fr. */
export function Reveal({ children }: { children: ReactNode }) {
  return (
    <div className="ie-reveal">
      <div>{children}</div>
    </div>
  );
}

/** Save state shared by every concept. */
export function SaveBar({ session, onClose }: { session: EditSession; onClose?: () => void }) {
  const dirty = session.changed.length > 0;
  return (
    <div className="ie-savebar" data-dirty={dirty}>
      <p role="status" aria-live="polite">
        {session.error ??
          (dirty
            ? `${session.changed.length} ${session.changed.length === 1 ? "change" : "changes"}`
            : session.savedAt
              ? "Saved"
              : "No changes")}
      </p>
      {dirty ? (
        <button type="button" className="ie-button" onClick={session.discard}>
          Discard
        </button>
      ) : onClose ? (
        <button type="button" className="ie-button" onClick={onClose}>
          Done
        </button>
      ) : null}
      <button type="button" className="ie-button ie-primary" disabled={!dirty || Boolean(session.error)} onClick={session.save}>
        Save changes
      </button>
    </div>
  );
}

/** Archived and deleted states replace the editor body, so the outcome is unambiguous. */
export function LifecycleNotice({ session }: { session: EditSession }) {
  if (session.lifecycle === "active") return null;
  return (
    <div className="ie-notice" data-kind={session.lifecycle} role="status">
      {session.lifecycle === "archived" ? (
        <>
          <Archive size={15} aria-hidden="true" />
          <span>Archived. It’s out of your plan; its history stays in Achieved.</span>
          <button type="button" onClick={() => session.setLifecycle("active")}>
            Restore
          </button>
        </>
      ) : (
        <>
          <Trash2 size={15} aria-hidden="true" />
          <span>Deleted (sample only). The dialog would close here.</span>
          <button type="button" onClick={() => session.setLifecycle("active")}>
            Bring back sample
          </button>
        </>
      )}
    </div>
  );
}
