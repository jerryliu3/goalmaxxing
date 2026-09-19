import { appIconHref } from "@/lib/brand/app-icon";
import { APPLICATION_BRANDS, applicationTheme, type ApplicationBrandId } from "@cadence/shared/brand";

/**
 * Visual style catalog. Layout and IA stay shared; each entry is a skin
 * (tokens, type, completion mark, tab chrome).
 */
export const UI_STYLE_IDS = [
  "original",
  "gazetteer",
  "undertow",
  "kiln",
  "court",
  "opaline",
  "bloodstone",
  "pitlane",
] as const;

export type UiStyleId = (typeof UI_STYLE_IDS)[number];

export const DEFAULT_UI_STYLE_ID: UiStyleId = "original";
export const UI_STYLE_COOKIE_NAME = "gm_ui_style";
export const UI_STYLE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const TRANSLUCENT_STATUS_BAR_STYLE_IDS = new Set<UiStyleId>([
  "gazetteer",
  "undertow",
  "kiln",
  "bloodstone",
  "pitlane",
]);

export type CompletionMarkKind = "circle" | "nest";
export type TabChromeKind = "pills" | "underline";

export interface UiStyle {
  id: UiStyleId;
  label: string;
  description: string;
  htmlClass: string;
  themeColor: string;
  backgroundColor: string;
  completionMark: CompletionMarkKind;
  tabChrome: TabChromeKind;
  remapDisplayColors: boolean;
  themeId: ApplicationBrandId;
}

function styleDescription(id: UiStyleId): string {
  const premise = APPLICATION_BRANDS[id].description;
  if (id === "original" || id === "gazetteer") {
    return premise;
  }
  if (applicationTheme(id).appearance === "dark") {
    return `${premise}. Authored as a dark world and does not follow system light mode.`;
  }
  return `${premise}. Authored as a light world and does not follow system dark mode.`;
}

export const UI_STYLES = Object.fromEntries(UI_STYLE_IDS.map((id) => {
  const brand = APPLICATION_BRANDS[id];
  return [id, {
    id,
    themeId: id,
    label: brand.name,
    description: styleDescription(id),
    htmlClass: id === "gazetteer" ? "gm-gazetteer" : "",
    themeColor: brand.iconColor,
    backgroundColor: brand.page,
    completionMark: brand.completionMark,
    tabChrome: brand.tabChrome,
    remapDisplayColors: id === "gazetteer",
  }];
})) as Record<UiStyleId, UiStyle>;

export const UI_STYLE_OPTIONS = UI_STYLE_IDS.map((id) => UI_STYLES[id]);

export function isUiStyleId(value: string | null | undefined): value is UiStyleId {
  return typeof value === "string" && (UI_STYLE_IDS as readonly string[]).includes(value);
}

export function parseUiStyleId(value: string | null | undefined): UiStyleId {
  return isUiStyleId(value) ? value : DEFAULT_UI_STYLE_ID;
}

export function getUiStyle(id: UiStyleId = DEFAULT_UI_STYLE_ID): UiStyle {
  return UI_STYLES[id];
}

export function usesTranslucentStatusBar(id: UiStyleId): boolean {
  return TRANSLUCENT_STATUS_BAR_STYLE_IDS.has(id);
}

export function resolveUiStyleId(explicit?: string | null): UiStyleId {
  if (isUiStyleId(explicit)) {
    return explicit;
  }
  if (typeof document !== "undefined") {
    return parseUiStyleId(document.documentElement.dataset.uiStyle);
  }
  return DEFAULT_UI_STYLE_ID;
}

export function uiStyleHtmlClasses(): string[] {
  return UI_STYLE_OPTIONS.map((style) => style.htmlClass).filter(
    (className): className is string => className.length > 0
  );
}

export function applyDocumentUiStyle(style: UiStyle) {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.dataset.uiStyle = style.id;
  for (const className of uiStyleHtmlClasses()) {
    root.classList.remove(className);
  }
  if (style.htmlClass) {
    root.classList.add(style.htmlClass);
  }
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
  statusBarMeta.content = usesTranslucentStatusBar(style.id)
    ? "black-translucent"
    : "default";
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
