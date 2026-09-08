import { appIconHref } from "@/lib/brand/app-icon";

/**
 * Visual style catalog. Layout and IA stay shared; each entry is a skin
 * (tokens, type, completion mark, tab chrome). Add a new id + CSS class later.
 */
export const UI_STYLE_IDS = ["original", "gazetteer"] as const;

export type UiStyleId = (typeof UI_STYLE_IDS)[number];

export const DEFAULT_UI_STYLE_ID: UiStyleId = "original";
export const UI_STYLE_COOKIE_NAME = "gm_ui_style";
export const UI_STYLE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

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
}

export const UI_STYLES: Record<UiStyleId, UiStyle> = {
  original: {
    id: "original",
    label: "Original",
    description: "Classic Goalmaxxing chrome: Geist, identity blue, and pill tabs.",
    htmlClass: "",
    themeColor: "#0F64BF",
    backgroundColor: "#fafafa",
    completionMark: "circle",
    tabChrome: "pills",
    remapDisplayColors: false,
  },
  gazetteer: {
    id: "gazetteer",
    label: "Gazetteer",
    description: "Paper, walnut ink, stamp rust, Nest completion, and ledger chrome.",
    htmlClass: "gm-gazetteer",
    themeColor: "#9A4F2C",
    backgroundColor: "#f3ead8",
    completionMark: "nest",
    tabChrome: "underline",
    remapDisplayColors: true,
  },
};

export const UI_STYLE_OPTIONS = UI_STYLE_IDS.map((id) => UI_STYLES[id]);

export function isUiStyleId(value: string | null | undefined): value is UiStyleId {
  return value === "original" || value === "gazetteer";
}

export function parseUiStyleId(value: string | null | undefined): UiStyleId {
  return isUiStyleId(value) ? value : DEFAULT_UI_STYLE_ID;
}

export function getUiStyle(id: UiStyleId = DEFAULT_UI_STYLE_ID): UiStyle {
  return UI_STYLES[id];
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
    themeMeta.setAttribute("content", style.themeColor);
  }
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
