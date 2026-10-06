import type { ThemeDefinition } from "../roles";
import { GAZETTEER_THEME } from "./gazetteer";
import { ORIGINAL_THEME } from "./original";

export { GAZETTEER_THEME } from "./gazetteer";
export { ORIGINAL_THEME } from "./original";

/** Every theme, in picker order. The first one is the default. */
export const THEMES = [ORIGINAL_THEME, GAZETTEER_THEME] as const satisfies readonly ThemeDefinition[];

export type Theme = (typeof THEMES)[number];
export type ThemeId = Theme["id"];

export const DEFAULT_THEME_ID: ThemeId = THEMES[0].id;

const THEMES_BY_ID = Object.fromEntries(THEMES.map((theme) => [theme.id, theme])) as Record<
  ThemeId,
  Theme
>;

export const THEME_IDS = THEMES.map((theme) => theme.id) as readonly ThemeId[];

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return (THEME_IDS as readonly (string | null | undefined)[]).includes(value);
}

export function getTheme(id: ThemeId): Theme {
  return THEMES_BY_ID[id];
}
