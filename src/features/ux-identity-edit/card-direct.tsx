"use client";

import { Eye, Lock, Minus, Plus } from "lucide-react";
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DEFAULT_GOAL_CATEGORIES, type CategorySelection } from "@/lib/goals/category";
import type { GoalDifficulty } from "@/lib/goals/types";
import { cadenceBounds, cadenceCountEditable, categoryPatch, isMilestoneGoal } from "./edit-model";
import type { BackStyle } from "./card-back";
import { CardStage, FaceControls, goalColorStyle, isChanged, regionStyle } from "./card-stage";
import { useCardRegions, type FaceFact, type FaceRegion } from "./use-card-regions";
import type { EditSession } from "./use-edit-session";

const STRETCHES: { level: GoalDifficulty; label: string }[] = [
  { level: "easy", label: "Easy · a little lift" },
  { level: "medium", label: "Medium · a good push" },
  { level: "hard", label: "Hard · a big stretch" },
];
const PALETTE_WIDTH = 5 * 32 + 12;
const VISIBILITY_WIDTH = 252;

/** A short confirmation that floats above the fact that just changed. */
function useBubble() {
  const [bubble, setBubble] = useState<{ fact: FaceFact; text: string; key: number } | null>(null);
  useEffect(() => {
    if (!bubble) return;
    const timer = setTimeout(() => setBubble(null), 1400);
    return () => clearTimeout(timer);
  }, [bubble]);
  return { bubble, show: (fact: FaceFact, text: string) => setBubble({ fact, text, key: Date.now() }) };
}

/** The card is the control: type over the title, nudge the number, tap the bars, dots and dates. */
export function DirectCard({ session, backStyle, touch }: { session: EditSession; backStyle: BackStyle; touch: boolean }) {
  const { fields, patch } = session;
  const [renaming, setRenaming] = useState(false);
  const [popup, setPopup] = useState<"category" | "visibility" | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [back, setBack] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const { regions, width } = useCardRegions(stageRef, JSON.stringify(fields) + renaming);
  const { bubble, show } = useBubble();
  const titleFont = useTitleFont(stageRef, regions);
  const region = (fact: FaceFact) => regions.find((item) => item.fact === fact);
  const popupRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!popup) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      const outside = event instanceof KeyboardEvent ? event.key === "Escape" : !popupRef.current?.contains(event.target as Node) && !(event.target as Element).closest(`[data-popup-anchor="${popup}"]`);
      if (outside) {
        setPopup(null);
        setPreview(null);
      }
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [popup]);
  const toggle = (which: "category" | "visibility") => {
    setPreview(null);
    setPopup((current) => (current === which ? null : which));
  };

  const count = Number(fields.target_count) || 1;
  const { min, max } = cadenceBounds(fields, session.completed);
  const [name, cadence, category, stretch, visibility] = (["name", "cadence", "category", "stretch", "visibility"] as const).map(region);
  const clampX = (x: number, size: number) => Math.max(6, Math.min(x, width - size - 6));

  const overlay = (
    <div className="ie-face-overlay" data-design="direct" data-touch={touch} data-renaming={renaming}>
      {name && (renaming ? (
        <textarea
          autoFocus
          className="ie-title-input"
          style={{ ...regionStyle(name), ...titleFont }}
          aria-label="Goal name"
          value={fields.title}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => patch({ title: event.target.value.replace(/\n/g, "") })}
          onBlur={() => setRenaming(false)}
          onKeyDown={(event) => (event.key === "Enter" || event.key === "Escape") && setRenaming(false)}
        />
      ) : (
        <button type="button" className="ie-zone" data-changed={isChanged("name", session)} style={regionStyle(name)} aria-label="Rename goal" onClick={() => setRenaming(true)} />
      ))}

      {cadence && (
        <span className="ie-stepper-pill" style={{ left: clampX(cadence.x + cadence.width + 10, 34), top: cadence.y + cadence.height / 2 }} data-changed={isChanged("cadence", session)}>
          {cadenceCountEditable(fields) ? (
            <>
              <button type="button" aria-label="More" disabled={count >= max} onClick={() => patch({ target_count: String(count + 1) })}><Plus size={14} /></button>
              <button
                type="button"
                aria-label="Fewer"
                disabled={count <= min}
                onClick={() => patch({ target_count: String(count - 1), ...(isMilestoneGoal(fields) ? { milestone_names: fields.milestone_names.slice(0, count - 1) } : {}) })}
              >
                <Minus size={14} />
              </button>
            </>
          ) : (
            <span className="ie-stepper-lock" title="Daily goals are one a day"><Lock size={12} /></span>
          )}
        </span>
      )}

      {category && (
        <>
          <button type="button" className="ie-zone" data-popup-anchor="category" data-changed={isChanged("category", session)} style={regionStyle(category)} aria-label="Change category" aria-expanded={popup === "category"} onClick={() => toggle("category")} />
          {popup === "category" && (() => {
            const left = clampX(category.x - 6, PALETTE_WIDTH);
            const current = DEFAULT_GOAL_CATEGORIES.find((option) => option.key === fields.category_selection);
            return (
              // Tapping a dot recolours the card live and keeps the palette open; the caption names it.
              <span ref={popupRef} className="ie-card-popup ie-palette" data-placement="above" style={{ left, top: category.y - 78, "--caret": `${category.x + 14 - left}px` } as CSSProperties} role="group" aria-label="Category">
                <span className="ie-palette-dots">
                  {DEFAULT_GOAL_CATEGORIES.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      aria-label={option.label}
                      aria-pressed={fields.category_selection === option.key}
                      style={{ background: option.color }}
                      onPointerEnter={() => setPreview(option.label)}
                      onPointerLeave={() => setPreview(null)}
                      onFocus={() => setPreview(option.label)}
                      onBlur={() => setPreview(null)}
                      onClick={() => patch(categoryPatch(fields, option.key as CategorySelection))}
                    />
                  ))}
                </span>
                <span className="ie-popup-caption" aria-live="polite">{preview ?? current?.label}</span>
              </span>
            );
          })()}
        </>
      )}

      {stretch && (() => {
        const level = STRETCHES.findIndex((item) => item.level === fields.difficulty);
        const step = (delta: number) => {
          const next = STRETCHES[level + delta];
          patch({ difficulty: next.level });
          show("stretch", next.label);
        };
        // − and + flank the effort bars, kept inside the card's edge.
        const right = Math.min(stretch.x + stretch.width + 3, width - 26);
        return (
          <span className="ie-stretch-control" data-changed={isChanged("stretch", session)} role="group" aria-label={`Stretch: ${STRETCHES[level].label}`}>
            <button type="button" aria-label="Easier" disabled={level <= 0} style={{ left: stretch.x - 27, top: stretch.y + stretch.height / 2 }} onClick={() => step(-1)}><Minus size={13} /></button>
            <span className="ie-stretch-frame" style={regionStyle(stretch)} aria-hidden="true" />
            <button type="button" aria-label="Harder" disabled={level >= STRETCHES.length - 1} style={{ left: right, top: stretch.y + stretch.height / 2 }} onClick={() => step(1)}><Plus size={13} /></button>
          </span>
        );
      })()}

      <PickerZone region={region("deadline")} type="date" label="Deadline" value={fields.end_date} min={fields.start_date} changed={isChanged("deadline", session)} onChange={(value) => patch({ end_date: value })} />
      <PickerZone region={region("time")} type="time" label="Time of day" value={fields.default_local_time} changed={isChanged("time", session)} onChange={(value) => patch({ default_local_time: value })} />

      {visibility && (
        <>
          <button type="button" className="ie-zone" data-popup-anchor="visibility" data-changed={isChanged("visibility", session)} style={regionStyle(visibility)} aria-label={`Visibility: ${fields.is_private ? "private" : "visible to friends"}`} aria-expanded={popup === "visibility"} onClick={() => toggle("visibility")} />
          {popup === "visibility" && (() => {
            const left = clampX(visibility.x - 6, VISIBILITY_WIDTH);
            const pick = (isPrivate: boolean) => {
              if (isPrivate !== fields.is_private) {
                patch({ is_private: isPrivate });
                show("visibility", isPrivate ? "Now private" : "Visible to friends");
              }
              setPopup(null);
            };
            return (
              <span ref={popupRef} className="ie-card-popup ie-visibility" data-placement="below" style={{ left, top: visibility.y + visibility.height + 12, "--caret": `${visibility.x + 18 - left}px` } as CSSProperties} role="group" aria-label="Who can see this goal">
                <button type="button" aria-pressed={!fields.is_private} onClick={() => pick(false)}>
                  <Eye size={14} /> Visible to friends
                </button>
                <button type="button" aria-pressed={fields.is_private} onClick={() => pick(true)}>
                  <Lock size={14} /> Private
                </button>
              </span>
            );
          })()}
        </>
      )}

      {bubble && region(bubble.fact) && (
        <span key={bubble.key} className="ie-bubble" style={{ left: clampX(region(bubble.fact)!.x + region(bubble.fact)!.width / 2 - 70, 140), top: region(bubble.fact)!.y - 34 }} role="status">
          {bubble.text}
        </span>
      )}
    </div>
  );

  return (
    <div className="ie-cardface" data-design="direct" style={goalColorStyle(session)}>
      <CardStage session={session} stageRef={stageRef} overlay={overlay} back={back} backStyle={backStyle} />
      <FaceControls session={session} back={back} onFlip={() => { setPopup(null); setBack(!back); }} hint="Tap anything on the card to change it." />
    </div>
  );
}

/** Native picker laid over the printed date or time; opens on tap. */
function PickerZone({ region, type, label, value, min, changed, onChange }: { region?: FaceRegion; type: "date" | "time"; label: string; value: string; min?: string; changed: boolean; onChange: (value: string) => void }) {
  if (!region) return null;
  return (
    <label className="ie-zone ie-picker-zone" data-present={region.present} data-changed={changed} style={regionStyle(region)}>
      {!region.present && <span className="ie-ghost">+ {label.toLowerCase()}</span>}
      <input
        type={type}
        aria-label={label}
        value={value}
        min={min}
        step={type === "time" ? 300 : undefined}
        onClick={(event) => event.currentTarget.showPicker?.()}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

/** Match the overlay input to the card's computed title type, so renaming happens in place. */
function useTitleFont(stageRef: React.RefObject<HTMLDivElement | null>, regions: FaceRegion[]): CSSProperties {
  const [font, setFont] = useState<CSSProperties>({});
  useLayoutEffect(() => {
    const title = stageRef.current?.querySelector("[data-tempo-goal-card] h2");
    if (!title) return;
    const style = getComputedStyle(title);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measured from the rendered card
    setFont({ fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight, letterSpacing: style.letterSpacing, lineHeight: style.lineHeight, color: style.color });
  }, [stageRef, regions]);
  return font;
}
