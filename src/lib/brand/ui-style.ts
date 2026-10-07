import {
  DEFAULT_THEME_ID,
  getTheme,
  isThemeId,
  THEMES,
  type Theme,
  type ThemeId,
} from "@cadence/shared/brand";
import { appIconHref } from "@/lib/brand/app-icon";

/**
 * Web runtime for the shared theme registry (packages/shared/src/brand): which
 * theme the cookie selects and how it is applied to the document.
 */
export const UI_STYLE_COOKIE_NAME = "gm_ui_style";
export const UI_STYLE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Every registered theme is available in the picker. */
export function uiStyleOptions(): readonly Theme[] {
  return THEMES;
}

/** A cookie or request value as a registered theme id. */
export function parseUiStyleId(value: string | null | undefined): ThemeId {
  if (!isThemeId(value)) {
    return DEFAULT_THEME_ID;
  }
  return value;
}

export function resolveUiStyleId(explicit?: string | null): ThemeId {
  if (isThemeId(explicit)) {
    return explicit;
  }
  if (typeof document !== "undefined") {
    return parseUiStyleId(document.documentElement.dataset.uiStyle);
  }
  return DEFAULT_THEME_ID;
}

export function applyDocumentUiStyle(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.dataset.uiStyle = theme.id;
  document.documentElement.dataset.appearance = theme.appearance;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", theme.backgroundColor);
  }
  let statusBarMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="apple-mobile-web-app-status-bar-style"]'
  );
  if (!statusBarMeta) {
    statusBarMeta = document.createElement("meta");
    statusBarMeta.name = "apple-mobile-web-app-status-bar-style";
    document.head.append(statusBarMeta);
  }
  statusBarMeta.content = theme.statusBarStyle;
  const iconHref = appIconHref(theme.id);
  for (const link of document.querySelectorAll<HTMLLinkElement>(
    'link[rel="icon"], link[rel="apple-touch-icon"]'
  )) {
    link.href = iconHref;
  }
}

export function writeUiStyleCookie(styleId: ThemeId) {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${UI_STYLE_COOKIE_NAME}=${encodeURIComponent(styleId)}; Path=/; Max-Age=${UI_STYLE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
