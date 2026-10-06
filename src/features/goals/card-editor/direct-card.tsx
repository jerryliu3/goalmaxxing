"use client";

import { Eye, Lock, Minus, Plus } from "lucide-react";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { categoryChangePatch } from "@/lib/goals/card-colour";
import { DEFAULT_GOAL_CATEGORIES, getCategoryLabel, type CategorySelection } from "@/lib/goals/category";
import type { CardEditorSession } from "./card-editor-session";
import { cadenceBounds, cadenceCountEditable, DIFFICULTY_OPTIONS, type FaceFact, targetCountPatch } from "./card-facts";
import { CardScene } from "./card-scene";
import { useEscapeLayer } from "./inline-fact";
import { type FaceRegion, useCardRegions } from "./use-card-regions";
import "./card-editor.css";

const PALETTE_WIDTH = 5 * 32 + 14;
const VISIBILITY_WIDTH = 252;

type Popup = "category" | "visibility" | "deadline" | "time";
const SCHEDULE_POPUP_WIDTH = 236;

function regionStyle(region: FaceRegion): CSSProperties {
  return { left: region.x, top: region.y, width: region.width, height: region.height };
}

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

/**
 * The card is the control (phone): type over the title, nudge the number and effort,
 * tap the category, privacy line, date or time. Every control sits on the fact it changes.
 */
export function DirectCard({ session, card, back, flipped }: { session: CardEditorSession; card: ReactNode; back: ReactNode; flipped: boolean }) {
  const { fields, patch } = session;
  const [renaming, setRenaming] = useState(false);
  const [openPopup, setPopup] = useState<Popup | null>(null);
  // Turning the card over closes any popup on its face.
  const popup = flipped ? null : openPopup;
  const [preview, setPreview] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLSpanElement>(null);
  const { regions, width } = useCardRegions(stageRef, JSON.stringify(fields) + renaming);
  const { bubble, show } = useBubble();
  const titleFont = useTitleFont(stageRef, regions);
  const region = (fact: FaceFact) => regions.find((item) => item.fact === fact);
  const changed = (fact: FaceFact) => session.changed.has(fact);
  const clampX = (x: number, size: number) => Math.max(6, Math.min(x, width - size - 6));

  const closePopup = useCallback(() => {
    setPopup(null);
    setPreview(null);
  }, []);
  const stopRenaming = useCallback(() => setRenaming(false), []);
  useEscapeLayer(popup !== null, closePopup);
  useEscapeLayer(renaming, stopRenaming);
  useEffect(() => {
    if (!popup) return;
    const close = (event: PointerEvent) => {
      if (!popupRef.current?.contains(event.target as Node) && !(event.target as Element).closest(`[data-popup-anchor="${popup}"]`)) closePopup();
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [popup, closePopup]);
  const toggle = (which: Popup) => {
    setPreview(null);
    setPopup((current) => (current === which ? null : which));
  };

  const count = Number(fields.target_count) || 1;
  const { min, max } = cadenceBounds(fields, session.completed);
  const [name, cadence, category, effort, visibility] = (["name", "cadence", "category", "difficulty", "visibility"] as const).map(region);
  const level = DIFFICULTY_OPTIONS.findIndex((option) => option.value === fields.difficulty);

  const overlay = (
    <div className="card-overlay" data-direct="true" data-renaming={renaming}>
      {name && (renaming ? (
        <textarea
          autoFocus
          className="card-title-input"
          style={{ ...regionStyle(name), ...titleFont }}
          aria-label="Goal name"
          value={fields.title}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => patch({ title: event.target.value.replace(/\n/g, "") })}
          onBlur={() => setRenaming(false)}
          onKeyDown={(event) => event.key === "Enter" && setRenaming(false)}
        />
      ) : (
        <button type="button" className="card-zone" data-changed={changed("name")} style={regionStyle(name)} aria-label="Rename goal" onClick={() => setRenaming(true)} />
      ))}

      {cadence && (
        // The +/− pill sits on the card's left edge, beside the number it changes; the right
        // edge already carries the effort controls.
        <span className="card-stepper-pill" data-changed={changed("cadence")} style={{ left: Math.max(cadence.x - 48, -14), top: cadence.y + cadence.height / 2 }}>
          {cadenceCountEditable(fields) ? (
            <>
              <button type="button" aria-label="More" disabled={count >= max} onClick={() => patch(targetCountPatch(fields, count + 1))}><Plus size={14} /></button>
              <button
                type="button"
                aria-label="Fewer"
                disabled={count <= min}
                onClick={() => patch(targetCountPatch(fields, count - 1))}
              >
                <Minus size={14} />
              </button>
            </>
          ) : (
            <span className="card-stepper-lock" title="Daily goals are one a day"><Lock size={12} /></span>
          )}
        </span>
      )}

      {category && (
        <>
          <button type="button" className="card-zone" data-popup-anchor="category" data-changed={changed("category")} style={regionStyle(category)} aria-label="Change category" aria-expanded={popup === "category"} onClick={() => toggle("category")} />
          {popup === "category" && (() => {
            const left = clampX(category.x - 6, PALETTE_WIDTH);
            return (
              // A tap recolours the card live and keeps the palette open; the caption names the colour.
              <span ref={popupRef} className="card-popup card-palette" data-placement="above" style={{ left, top: category.y - 78, "--caret": `${category.x + 14 - left}px` } as CSSProperties} role="group" aria-label="Category">
                <span className="card-palette-dots">
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
                      onClick={() => patch(categoryChangePatch(fields, option.key as CategorySelection))}
                    />
                  ))}
                </span>
                <span className="card-caption" aria-live="polite">{preview ?? getCategoryLabel(fields.category_selection, fields.custom_category)}</span>
              </span>
            );
          })()}
        </>
      )}

      {effort && (() => {
        const step = (delta: number) => {
          const next = DIFFICULTY_OPTIONS[level + delta];
          patch({ difficulty: next.value });
          show("difficulty", next.label);
        };
        // − and + flank the effort bars, kept inside the card's edge.
        const right = Math.min(effort.x + effort.width + 3, width - 26);
        return (
          <span className="card-effort" data-changed={changed("difficulty")} role="group" aria-label={`Difficulty: ${DIFFICULTY_OPTIONS[level]?.label ?? ""}`}>
            <button type="button" aria-label="Easier" disabled={level <= 0} style={{ left: effort.x - 27, top: effort.y + effort.height / 2 }} onClick={() => step(-1)}><Minus size={13} /></button>
            <span className="card-effort-frame" style={regionStyle(effort)} aria-hidden="true" />
            <button type="button" aria-label="Harder" disabled={level >= DIFFICULTY_OPTIONS.length - 1} style={{ left: right, top: effort.y + effort.height / 2 }} onClick={() => step(1)}><Plus size={13} /></button>
          </span>
        );
      })()}

      {(["deadline", "time"] as const).map((fact) => {
        const zone = region(fact);
        if (!zone) return null;
        const isDate = fact === "deadline";
        const label = isDate ? "Deadline" : "Time of day";
        const left = clampX(zone.x + zone.width / 2 - SCHEDULE_POPUP_WIDTH / 2, SCHEDULE_POPUP_WIDTH);
        return (
          <span key={fact}>
            <button type="button" className="card-zone" data-popup-anchor={fact} data-present={zone.present} data-changed={changed(fact)} style={regionStyle(zone)} aria-label={`Change ${label.toLowerCase()}`} aria-expanded={popup === fact} onClick={() => toggle(fact)}>
              {!zone.present && <span className="card-ghost">+ {label.toLowerCase()}</span>}
            </button>
            {popup === fact && (
              // A visible input, so the platform's own picker (wheel, calendar) opens reliably.
              <span ref={popupRef} className="card-popup card-schedule" data-placement="above" style={{ left, top: zone.y - 62, "--caret": `${zone.x + zone.width / 2 - 5 - left}px` } as CSSProperties} role="group" aria-label={label}>
                <input
                  autoFocus
                  type={isDate ? "date" : "time"}
                  aria-label={label}
                  min={isDate ? fields.start_date : undefined}
                  step={isDate ? undefined : 300}
                  value={isDate ? fields.end_date : fields.default_local_time}
                  onChange={(event) => patch(isDate ? { end_date: event.target.value } : { default_local_time: event.target.value })}
                  onKeyDown={(event) => event.key === "Enter" && closePopup()}
                />
                <button type="button" onClick={() => { patch(isDate ? { end_date: "" } : { default_local_time: "" }); closePopup(); }}>
                  {isDate ? "No deadline" : "Any time"}
                </button>
              </span>
            )}
          </span>
        );
      })}

      {visibility && session.canChangeVisibility && (
        <>
          <button type="button" className="card-zone" data-popup-anchor="visibility" data-changed={changed("visibility")} style={regionStyle(visibility)} aria-label={`Visibility: ${fields.is_private ? "private" : "visible to friends"}`} aria-expanded={popup === "visibility"} onClick={() => toggle("visibility")} />
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
              <span ref={popupRef} className="card-popup card-visibility" data-placement="below" style={{ left, top: visibility.y + visibility.height + 12, "--caret": `${visibility.x + 18 - left}px` } as CSSProperties} role="group" aria-label="Who can see this goal">
                <button type="button" aria-pressed={!fields.is_private} onClick={() => pick(false)}><Eye size={14} /> Visible to friends</button>
                <button type="button" aria-pressed={fields.is_private} onClick={() => pick(true)}><Lock size={14} /> Private</button>
              </span>
            );
          })()}
        </>
      )}

      {bubble && region(bubble.fact) && (
        <span key={bubble.key} className="card-bubble" style={{ left: clampX(region(bubble.fact)!.x + region(bubble.fact)!.width / 2 - 70, 140), top: region(bubble.fact)!.y - 34 }} role="status">
          {bubble.text}
        </span>
      )}
    </div>
  );

  return (
    <CardScene
      color={fields.color}
      flipped={flipped}
      back={back}
      front={
        <div ref={stageRef} className="card-stage">
          {card}
          {overlay}
        </div>
      }
    />
  );
}

/** Match the overlay input to the card's computed title type, so renaming happens in place. */
function useTitleFont(stageRef: React.RefObject<HTMLDivElement | null>, regions: FaceRegion[]): CSSProperties {
  const [font, setFont] = useState<CSSProperties>({});
  useLayoutEffect(() => {
    const title = stageRef.current?.querySelector("[data-tempo-goal-card] h2");
    if (!title) return;
    const style = getComputedStyle(title);
    setFont({ fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight, letterSpacing: style.letterSpacing, lineHeight: style.lineHeight, color: style.color });
  }, [stageRef, regions]);
  return font;
}
