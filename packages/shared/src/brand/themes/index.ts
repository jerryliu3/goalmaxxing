import type { ThemeDefinition } from "../roles";
import { GAZETTEER_THEME } from "./gazetteer";
import { ORIGINAL_THEME } from "./original";

export { GAZETTEER_THEME } from "./gazetteer";
export { ORIGINAL_THEME } from "./original";

/** Every theme, in picker order. The first one is the default. */
export const THEMES = [ORIGINAL_THEME, GAZETTEER_THEME] as const satisfies readonly ThemeDefinition[];

export type ThemeId = (typeof THEMES)[number]["id"];

export const THEME_IDS = THEMES.map((theme) => theme.id) as readonly ThemeId[];

export const DEFAULT_THEME_ID: ThemeId = THEMES[0].id;

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return (THEME_IDS as readonly (string | null | undefined)[]).includes(value);
}

export function getTheme(id: ThemeId): ThemeDefinition {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
