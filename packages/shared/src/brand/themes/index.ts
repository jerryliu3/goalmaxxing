import type { ThemeDefinition } from "../roles";
import { BLOODSTONE_THEME } from "./bloodstone";
import { COURT_THEME } from "./court";
import { GAZETTEER_THEME } from "./gazetteer";
import { KILN_THEME } from "./kiln";
import { OPALINE_THEME } from "./opaline";
import { ORIGINAL_THEME } from "./original";
import { PITLANE_THEME } from "./pitlane";
import { UNDERTOW_THEME } from "./undertow";

export { GAZETTEER_THEME } from "./gazetteer";
export { ORIGINAL_THEME } from "./original";

/**
 * Every theme, in picker order: live themes, then the shortlisted study
 * skins. The first theme is the default.
 */
export const THEMES = [
  ORIGINAL_THEME,
  GAZETTEER_THEME,
  UNDERTOW_THEME,
  KILN_THEME,
  COURT_THEME,
  OPALINE_THEME,
  BLOODSTONE_THEME,
  PITLANE_THEME,
] as const satisfies readonly ThemeDefinition[];

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
