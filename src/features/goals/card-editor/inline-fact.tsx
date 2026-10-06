"use client";

import { Lock, Minus, Plus, Search } from "lucide-react";
import { type CSSProperties, type KeyboardEvent, type RefObject, useEffect, useState } from "react";
import { CARD_COLOURS, categoryChangePatch, colourFollowsCategory, cardColourName } from "@/lib/goals/card-colour";
import { CATEGORY_CUSTOM_VALUE, DEFAULT_GOAL_CATEGORIES, getCategorySwatchColor, type CategorySelection } from "@/lib/goals/category";
import type { GoalDifficulty } from "@/lib/goals/types";
import { MilestoneNameFields } from "../milestone-name-fields";
import { clampPlaqueTarget, creationPlaqueTarget, MAX_PLAQUE_TARGET, MIN_PLAQUE_TARGET } from "../card-material/creation-plaque-target";
import type { CardEditorSession } from "./card-editor-session";
import { cadenceBounds, cadenceCountEditable, cadenceSummary, cadenceUnit, isMilestoneGoal, lockedRhythmLabel, type CardFact } from "./card-facts";

/** Facts whose editor needs the full width under the label rather than the value's spot. */
export const WIDE_FACTS: CardFact[] = ["description", "link", "milestones", "color"];

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

/**
 * While an inline editor is open, Escape closes it, not the sheet around the card. Window
 * capture runs before the dialog's own document-level Escape handling, so it can claim it.
 */
export function useEscapeLayer(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const handle = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onEscape();
    };
    window.addEventListener("keydown", handle, { capture: true });
    return () => window.removeEventListener("keydown", handle, { capture: true });
  }, [active, onEscape]);
}

function Segments<T extends string>({ label, value, options, onPick }: { label: string; value: T; options: { value: T; label: string; color?: string }[]; onPick: (value: T) => void }) {
  return (
    <span className="card-segments" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          data-dot={Boolean(option.color)}
          style={option.color ? ({ "--dot": option.color } as CSSProperties) : undefined}
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
    <span className="card-stepper">
      <button type="button" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus size={13} /></button>
      <strong aria-live="polite">{value}</strong>
      <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={13} /></button>
      <span>{unit}</span>
    </span>
  );
}

/**
 * The compact control that takes the place of a fact's value, inside the same container.
 * Text becomes a field in place; choices apply and close on pick; steppers stay until
 * Enter, Escape or a press outside.
 */
export function InlineFact({ fact, session, onDone }: { fact: CardFact; session: CardEditorSession; onDone: () => void }) {
  const { fields, patch } = session;
  const keys = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" || (event.key === "Enter" && !(event.target instanceof HTMLTextAreaElement))) {
      event.preventDefault();
      onDone();
    }
  };
  switch (fact) {
    case "name":
      return <input autoFocus className="card-inline-text" aria-label="Goal name" value={fields.title} onFocus={(event) => event.currentTarget.select()} onChange={(event) => patch({ title: event.target.value })} onKeyDown={keys} />;
    case "reward":
      return <input autoFocus maxLength={500} className="card-inline-text" aria-label="Your reward" placeholder="Something to look forward to" value={fields.reward_text} onChange={(event) => patch({ reward_text: event.target.value })} onKeyDown={keys} />;
    case "description":
      return <textarea autoFocus className="card-inline-text card-inline-area" aria-label="Why it matters" rows={3} placeholder="Why this matters to you — a line for future you." value={fields.description} onChange={(event) => patch({ description: event.target.value })} onKeyDown={keys} />;
    case "cadence": {
      if (!cadenceCountEditable(fields)) {
        return <span className="card-inline-note"><Lock size={12} /> {cadenceSummary(fields)} · fixed for daily goals</span>;
      }
      const { min, max } = cadenceBounds(fields, session.completed);
      const count = Number(fields.target_count) || min;
      return (
        <span className="card-inline-row" onKeyDown={keys} title={`${lockedRhythmLabel(fields)} · set when you created it`}>
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
    case "plaque": {
      const value = fields.plaque_target ?? creationPlaqueTarget(fields);
      return <Stepper label="completions" value={value} min={MIN_PLAQUE_TARGET} max={MAX_PLAQUE_TARGET} unit="completions" onChange={(next) => patch({ plaque_target: clampPlaqueTarget(next) })} />;
    }
    case "category":
      return (
        <Segments<CategorySelection>
          label="Category"
          value={fields.category_selection}
          options={[
            ...DEFAULT_GOAL_CATEGORIES.map((category) => ({ value: category.key as CategorySelection, label: category.label, color: category.color })),
            ...(fields.category_selection === CATEGORY_CUSTOM_VALUE && fields.custom_category
              ? [{ value: CATEGORY_CUSTOM_VALUE as CategorySelection, label: fields.custom_category, color: getCategorySwatchColor(CATEGORY_CUSTOM_VALUE) }]
              : []),
          ]}
          onPick={(value) => {
            patch(categoryChangePatch(fields, value));
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
      if (!session.canChangeVisibility) return <span className="card-inline-note"><Lock size={12} /> Team goals are visible to your team</span>;
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
        <span className="card-inline-row">
          <input autoFocus type="date" className="card-inline-text card-inline-date" aria-label="Deadline" min={fields.start_date} value={fields.end_date} onChange={(event) => patch({ end_date: event.target.value })} onKeyDown={keys} />
          <button type="button" className="card-inline-clear" onClick={() => { patch({ end_date: "" }); onDone(); }}>No deadline</button>
        </span>
      );
    case "time":
      return (
        <span className="card-inline-row">
          <input autoFocus type="time" step={300} className="card-inline-text card-inline-date" aria-label="Time of day" value={fields.default_local_time} onChange={(event) => patch({ default_local_time: event.target.value })} onKeyDown={keys} />
          <button type="button" className="card-inline-clear" onClick={() => { patch({ default_local_time: "" }); onDone(); }}>Any time</button>
        </span>
      );
    case "color":
      return <ColourPicker session={session} />;
    case "link":
      return session.link ? <LinkPicker link={session.link} onDone={onDone} /> : null;
    case "milestones":
      return (
        <MilestoneNameFields
          count={Number(fields.target_count) || 0}
          values={fields.milestone_names}
          showLabel={false}
          keyPrefix="card-milestone"
          onValueChange={(index, value) => {
            const names = [...fields.milestone_names];
            names[index] = value;
            patch({ milestone_names: names });
          }}
        />
      );
    case "start":
      return null;
  }
}

/** "Match category" keeps the colour following the category; a named colour sticks. Picks apply live. */
function ColourPicker({ session }: { session: CardEditorSession }) {
  const { fields, patch } = session;
  const [preview, setPreview] = useState<string | null>(null);
  const follows = colourFollowsCategory(fields.color, fields.category_selection);
  const categoryColour = getCategorySwatchColor(fields.category_selection);
  return (
    <span className="card-colour-picker">
      <button type="button" className="card-match-chip" aria-pressed={follows} onClick={() => patch({ color: categoryColour })}>
        <i className="card-dot" style={{ background: categoryColour }} /> Match category
      </button>
      <span className="card-swatches" role="group" aria-label="Card colour">
        {CARD_COLOURS.map((colour) => (
          <button
            key={colour.hex}
            type="button"
            aria-label={colour.name}
            aria-pressed={!follows && fields.color.toLowerCase() === colour.hex}
            style={{ background: colour.hex }}
            onPointerEnter={() => setPreview(colour.name)}
            onPointerLeave={() => setPreview(null)}
            onFocus={() => setPreview(colour.name)}
            onBlur={() => setPreview(null)}
            onClick={() => patch({ color: colour.hex })}
          />
        ))}
      </span>
      <span className="card-caption" aria-live="polite">{preview ?? cardColourName(fields.color, fields.category_selection)}</span>
    </span>
  );
}

/** Search-first goal picker over the form's own link filtering, so long lists stay usable. */
function LinkPicker({ link, onDone }: { link: NonNullable<CardEditorSession["link"]>; onDone: () => void }) {
  const pick = (goalId: string) => {
    link.onChange(goalId);
    link.onSearch("");
    onDone();
  };
  const searching = link.search.trim().length > 0;
  return (
    <span className="card-link-picker">
      <label className="card-link-search">
        <Search size={13} aria-hidden="true" />
        <input
          autoFocus
          aria-label="Search your goals"
          placeholder="Search your goals"
          value={link.search}
          onChange={(event) => link.onSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onDone();
            if (event.key === "Enter") {
              event.preventDefault();
              if (link.options.length === 1) pick(link.options[0].id);
            }
          }}
        />
      </label>
      <span className="card-options" role="listbox" aria-label="Also counts toward">
        {!searching && (
          <button type="button" role="option" aria-selected={link.value === "none"} onClick={() => pick("none")}>Just this goal</button>
        )}
        {link.options.map((goal) => (
          <button key={goal.id} type="button" role="option" aria-selected={link.value === goal.id} onClick={() => pick(goal.id)}>
            {goal.title}
          </button>
        ))}
        {searching && link.options.length === 0 && <span className="card-options-empty">No goals match “{link.search.trim()}”</span>}
      </span>
    </span>
  );
}
