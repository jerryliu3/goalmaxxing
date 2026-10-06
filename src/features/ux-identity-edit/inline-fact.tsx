"use client";

import { Lock, Minus, Plus } from "lucide-react";
import { type CSSProperties, type KeyboardEvent, type RefObject, useEffect } from "react";
import { DEFAULT_GOAL_CATEGORIES, getCategorySwatchColor, type CategorySelection } from "@/lib/goals/category";
import type { GoalDifficulty } from "@/lib/goals/types";
import { cadenceBounds, cadenceCountEditable, cadenceSummary, isMilestoneGoal, lockedRhythmLabel, type EditFact } from "./edit-model";
import { FactEditor } from "./fact-editors";
import type { EditSession } from "./use-edit-session";

/** Facts whose inline editor needs the full width under the label rather than the value's spot. */
export const WIDE_FACTS: EditFact[] = ["description", "link", "milestones"];

/** Close an inline editor on a press outside its container. */
export function useDismiss(ref: RefObject<HTMLElement | null>, active: boolean, onDone: () => void) {
  useEffect(() => {
    if (!active) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onDone();
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [ref, active, onDone]);
}

function cadenceUnit(fields: EditSession["fields"]) {
  if (isMilestoneGoal(fields)) return "milestones";
  if (fields.target_basis === "lifetime") return "sessions in total";
  return fields.recurrence_interval === "monthly" ? "days a month" : "days a week";
}

function Segments<T extends string>({ label, value, options, onPick }: { label: string; value: T; options: { value: T; label: string; color?: string }[]; onPick: (value: T) => void }) {
  return (
    <span className="ie-segments-inline" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          style={option.color ? ({ "--dot": option.color } as CSSProperties) : undefined}
          data-dot={Boolean(option.color)}
          onClick={() => onPick(option.value)}
        >
          {option.label}
        </button>
      ))}
    </span>
  );
}

function Stepper({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (value: number) => void }) {
  return (
    <span className="ie-inline-stepper">
      <button type="button" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus size={13} /></button>
      <strong aria-live="polite">{value}</strong>
      <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={13} /></button>
      <span>{unit}</span>
    </span>
  );
}

/**
 * The compact editor that takes the place of a fact's value, inside the same container.
 * Text becomes a field in place; choices apply and close on pick; steppers stay until
 * Enter, Escape or a press outside.
 */
export function InlineFact({ fact, session, onDone }: { fact: EditFact; session: EditSession; onDone: () => void }) {
  const { fields, patch } = session;
  const keys = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" || (event.key === "Enter" && !(event.target instanceof HTMLTextAreaElement))) {
      event.preventDefault();
      onDone();
    }
  };
  switch (fact) {
    case "name":
      return <input autoFocus className="ie-inline-text" aria-label="Goal name" value={fields.title} onFocus={(event) => event.currentTarget.select()} onChange={(event) => patch({ title: event.target.value })} onKeyDown={keys} />;
    case "reward":
      return <input autoFocus className="ie-inline-text" aria-label="Your reward" placeholder="Something to look forward to" value={fields.reward_text} onChange={(event) => patch({ reward_text: event.target.value })} onKeyDown={keys} />;
    case "description":
      return <textarea autoFocus className="ie-inline-text ie-inline-area" aria-label="Why it matters" rows={3} placeholder="Why this matters to you — a line for future you." value={fields.description} onChange={(event) => patch({ description: event.target.value })} onKeyDown={keys} />;
    case "cadence": {
      if (!cadenceCountEditable(fields)) {
        return <span className="ie-inline-note"><Lock size={12} /> {cadenceSummary(fields)} · fixed for daily goals</span>;
      }
      const { min, max } = cadenceBounds(fields, session.completed);
      const count = Number(fields.target_count) || 1;
      return (
        <span className="ie-inline-row" onKeyDown={keys} title={`${lockedRhythmLabel(fields)} · set when you created it`}>
          <Stepper
            label="target"
            value={count}
            min={min}
            max={max}
            unit={cadenceUnit(fields)}
            onChange={(next) => patch({ target_count: String(next), ...(isMilestoneGoal(fields) ? { milestone_names: fields.milestone_names.slice(0, next) } : {}) })}
          />
        </span>
      );
    }
    case "plaque":
      return <Stepper label="completions" value={Number(fields.plaque_target) || 1} min={1} max={20} unit="completions" onChange={(next) => patch({ plaque_target: String(next) })} />;
    case "category":
      return (
        <Segments<CategorySelection>
          label="Category"
          value={fields.category_selection}
          options={DEFAULT_GOAL_CATEGORIES.map((category) => ({ value: category.key as CategorySelection, label: category.label, color: category.color }))}
          onPick={(value) => {
            patch({ category_selection: value, color: getCategorySwatchColor(value) });
            onDone();
          }}
        />
      );
    case "stretch":
      return (
        <Segments<GoalDifficulty>
          label="Stretch"
          value={fields.difficulty}
          options={[{ value: "easy", label: "Easy" }, { value: "medium", label: "Medium" }, { value: "hard", label: "Hard" }]}
          onPick={(difficulty) => {
            patch({ difficulty });
            onDone();
          }}
        />
      );
    case "visibility":
      return (
        <Segments
          label="Visibility"
          value={fields.is_private ? "private" : "friends"}
          options={[{ value: "friends", label: "Visible to friends" }, { value: "private", label: "Private" }]}
          onPick={(value) => {
            patch({ is_private: value === "private" });
            onDone();
          }}
        />
      );
    case "deadline":
      return (
        <span className="ie-inline-row">
          <input autoFocus type="date" className="ie-inline-text ie-inline-date" aria-label="Deadline" min={fields.start_date} value={fields.end_date} onChange={(event) => patch({ end_date: event.target.value })} onKeyDown={keys} />
          <button type="button" className="ie-inline-clear" onClick={() => { patch({ end_date: "" }); onDone(); }}>No deadline</button>
        </span>
      );
    case "time":
      return (
        <span className="ie-inline-row">
          <input autoFocus type="time" step={300} className="ie-inline-text ie-inline-date" aria-label="Time of day" value={fields.default_local_time} onChange={(event) => patch({ default_local_time: event.target.value })} onKeyDown={keys} />
          <button type="button" className="ie-inline-clear" onClick={() => { patch({ default_local_time: "" }); onDone(); }}>Any time</button>
        </span>
      );
    case "color":
      return (
        <span className="ie-inline-swatches" role="group" aria-label="Card colour">
          {DEFAULT_GOAL_CATEGORIES.map((category) => (
            <button key={category.key} type="button" aria-label={category.label} aria-pressed={fields.color.toLowerCase() === category.color} style={{ background: category.color }} onClick={() => { patch({ color: category.color }); onDone(); }} />
          ))}
        </span>
      );
    case "link":
      return (
        <span className="ie-inline-options" role="listbox" aria-label="Also counts toward">
          {[{ id: "none", title: "Just this goal" }, ...session.linkOptions].map((option) => (
            <button key={option.id} type="button" role="option" aria-selected={fields.linked_target_goal_id === option.id} onClick={() => { patch({ linked_target_goal_id: option.id }); onDone(); }}>
              {option.title}
            </button>
          ))}
        </span>
      );
    case "milestones":
      return <FactEditor fact="milestones" session={session} />;
  }
}
