"use client";

import { useState } from "react";
import { getCategorySwatchColor } from "@/lib/goals/category";
import { CARD_COLOURS, colourFollowsCategory } from "./edit-model";
import type { EditSession } from "./use-edit-session";

/**
 * Card colour as an override: "Match category" keeps it following the category;
 * any named colour sticks, even when the category later changes. Picks apply live.
 */
export function ColourPicker({ session }: { session: EditSession }) {
  const { fields, patch } = session;
  const [preview, setPreview] = useState<string | null>(null);
  const follows = colourFollowsCategory(fields);
  const categoryColour = getCategorySwatchColor(fields.category_selection);
  const current = follows ? "Matches category" : (CARD_COLOURS.find((colour) => colour.hex === fields.color.toLowerCase())?.name ?? "Custom");
  return (
    <span className="ie-colour-picker">
      <button type="button" className="ie-match-chip" aria-pressed={follows} onClick={() => patch({ color: categoryColour })}>
        <i className="ie-dot" style={{ background: categoryColour }} /> Match category
      </button>
      <span className="ie-inline-swatches" role="group" aria-label="Card colour">
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
      <span className="ie-popup-caption" aria-live="polite">{preview ?? current}</span>
    </span>
  );
}
