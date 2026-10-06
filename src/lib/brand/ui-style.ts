import {
  DEFAULT_THEME_ID,
  getTheme,
  isThemeId,
  THEMES,
  type ThemeDefinition,
  type ThemeId,
} from "@cadence/shared/brand";
import { appIconHref } from "@/lib/brand/app-icon";

/**
 * Web runtime for the shared theme registry (packages/shared/src/brand): which
 * theme the cookie selects and how it is applied to the document. Layout and IA
 * stay shared; a theme only changes tokens, type, and component variants.
 */
export type UiStyleId = ThemeId;
export type UiStyle = ThemeDefinition;

export const DEFAULT_UI_STYLE_ID: UiStyleId = DEFAULT_THEME_ID;
export const UI_STYLE_COOKIE_NAME = "gm_ui_style";
export const UI_STYLE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const UI_STYLE_OPTIONS: readonly UiStyle[] = THEMES;

export const isUiStyleId = isThemeId;

export function parseUiStyleId(value: string | null | undefined): UiStyleId {
  return isThemeId(value) ? value : DEFAULT_UI_STYLE_ID;
}

export function getUiStyle(id: UiStyleId = DEFAULT_UI_STYLE_ID): UiStyle {
  return getTheme(id);
}

export function resolveUiStyleId(explicit?: string | null): UiStyleId {
  if (isThemeId(explicit)) {
    return explicit;
  }
  if (typeof document !== "undefined") {
    return parseUiStyleId(document.documentElement.dataset.uiStyle);
  }
  return DEFAULT_UI_STYLE_ID;
}

export function applyDocumentUiStyle(style: UiStyle) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.dataset.uiStyle = style.id;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", style.backgroundColor);
  }
  let statusBarMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="apple-mobile-web-app-status-bar-style"]'
  );
  if (!statusBarMeta) {
    statusBarMeta = document.createElement("meta");
    statusBarMeta.name = "apple-mobile-web-app-status-bar-style";
    document.head.append(statusBarMeta);
  }
  statusBarMeta.content = style.statusBarStyle;
  const iconHref = appIconHref(style.id);
  for (const link of document.querySelectorAll<HTMLLinkElement>(
    'link[rel="icon"], link[rel="apple-touch-icon"]'
  )) {
    link.href = iconHref;
  }
}

export function writeUiStyleCookie(styleId: UiStyleId) {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${UI_STYLE_COOKIE_NAME}=${encodeURIComponent(styleId)}; Path=/; Max-Age=${UI_STYLE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
