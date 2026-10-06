"use client";

import { type CSSProperties, type RefObject, useLayoutEffect, useRef, useState } from "react";
import { CardScene } from "@/features/goals/card-editor/card-scene";
import { useCardRegions } from "@/features/goals/card-editor/use-card-regions";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { TempoCardVisibility } from "@/features/goals/tempo-creation-progress";
import type { GoalFormState } from "@/features/today/goal-form-model";
import "@/features/goals/card-editor/card-editor.css";

/** Nothing printed yet but the name: a blank card. */
export const BLANK_CARD: TempoCardVisibility = { category: false, rhythm: false, schedule: false, difficulty: false };

/**
 * A blank card whose title is the input: typed in the card's own title type, where it
 * will print, the same way the direct card renames.
 */
export function TitleOnCard({ fields, onTitle, onSubmit, visibility = BLANK_CARD }: { fields: GoalFormState; onTitle: (title: string) => void; onSubmit: () => void; visibility?: TempoCardVisibility }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { regions } = useCardRegions(stageRef, fields.title);
  const name = regions.find((region) => region.fact === "name");
  const font = useTitleFont(stageRef, fields.title);
  return (
    <CardScene
      color={fields.color}
      front={
        <div ref={stageRef} className="card-stage">
          <TempoGoalCard fields={fields} context="creation" rotatable={false} visibility={visibility} />
          <div className="card-overlay" data-renaming="true">
            {name ? (
              <textarea
                autoFocus
                rows={1}
                className="card-title-input gc-title-input"
                style={{ left: name.x, top: name.y, width: name.width, height: name.height, ...font }}
                aria-label="Goal name"
                placeholder="Something worth starting."
                value={fields.title}
                onChange={(event) => onTitle(event.target.value.replace(/\n/g, ""))}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  if (fields.title.trim()) onSubmit();
                }}
              />
            ) : null}
          </div>
        </div>
      }
    />
  );
}

/** The card's computed title type, so the input reads as the title being written. */
function useTitleFont(stageRef: RefObject<HTMLDivElement | null>, version: string): CSSProperties {
  const [font, setFont] = useState<CSSProperties>({});
  useLayoutEffect(() => {
    const title = stageRef.current?.querySelector("[data-tempo-goal-card] h2");
    if (!title) return;
    const style = getComputedStyle(title);
    setFont({ fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight, letterSpacing: style.letterSpacing, lineHeight: style.lineHeight, color: style.color });
  }, [stageRef, version]);
  return font;
}
