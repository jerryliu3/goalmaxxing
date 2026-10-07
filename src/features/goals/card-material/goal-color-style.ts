import type { CSSProperties } from "react";
import { goalCategoryTones } from "@cadence/shared/brand";

/**
 * Color variables for a goal card. Category colors also carry their authored
 * pigment and ink; custom colors leave those unset and the card CSS derives
 * them from the color itself.
 */
export function goalColorStyle(color: string): CSSProperties {
  const tones = goalCategoryTones(color);
  return {
    "--goal-color": color,
    ...(tones ? { "--goal-pigment": tones.pigment, "--goal-ink": tones.ink } : {}),
  } as CSSProperties;
}
