import type { FontId } from "./fonts";

/**
 * The theme contract. Components only ever reference these roles (as CSS
 * variables, Tailwind utilities, or native color keys); each theme supplies a
 * value for every role. Adding a role here makes every theme fail to compile
 * until it fills it in.
 */

/** shadcn surface roles: `--<role>` and Tailwind `bg-<role>` / `text-<role>`. */
export const SURFACE_COLOR_ROLES = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "border",
  "input",
  "ring",
] as const;

/** Goalmaxxing roles: `--gm-<role>` and Tailwind `bg-<role>` / `text-<role>`. */
export const APP_COLOR_ROLES = [
  "page",
  "gain",
  "recover",
  "warning",
  "warningFill",
  "selection",
  "selectionForeground",
  "today",
  "todayForeground",
  "daySelected",
  "daySelectedForeground",
  "adjacent",
  "adjacentForeground",
  "stampLight",
] as const;

/** Five-step activity scale: `--gm-heatmap-<n>`, consumed by CSS only. */
export const SCALE_COLOR_ROLES = [
  "heatmap0",
  "heatmap1",
  "heatmap2",
  "heatmap3",
  "heatmap4",
] as const;

export type SurfaceColorRole = (typeof SURFACE_COLOR_ROLES)[number];
export type AppColorRole = (typeof APP_COLOR_ROLES)[number];
export type ScaleColorRole = (typeof SCALE_COLOR_ROLES)[number];
export type ColorRole = SurfaceColorRole | AppColorRole | ScaleColorRole;

/** Any CSS color, including `var(...)` and `color-mix(...)` built from other roles. */
export type ThemeColors = Readonly<Record<ColorRole, string>>;

export type FontSlot = "sans" | "display" | "mono";

/**
 * Text roles: what a piece of text *is*, not how it looks. Each theme picks
 * the face and weight per role; call sites set only size, leading, color.
 * Web exposes them as `type-<role>` utilities.
 */
export const TEXT_ROLES = [
  /** The Goalmaxxing wordmark. */
  "wordmark",
  /** Statement headlines (landing, achievements showcase, auth). */
  "hero",
  /** Page and sheet titles: "Agenda", "Current goals", dialog titles. */
  "title",
  /** Section and card headings: "Scheduled goals", leaderboard cards. */
  "heading",
  /** Names of goals, tasks, milestones, and people in lists and cards. */
  "item",
  /** Small uppercase labels above content. */
  "eyebrow",
  /** Figures that are the point of a tile: streaks, scores, totals. */
  "stat",
  /** Small figures and meta lines: counts, "0 / 1 this week", dates on cards. */
  "figure",
] as const;

export type TextRole = (typeof TEXT_ROLES)[number];

export interface TextRoleStyle {
  readonly slot: FontSlot;
  readonly weight: number;
}

export type ThemeText = Readonly<Record<Exclude<TextRole, "eyebrow">, TextRoleStyle>> & {
  readonly eyebrow: TextRoleStyle & { readonly trackingEm: number };
};

export type CompletionMarkKind = "circle" | "nest";
export type TabChromeKind = "pills" | "underline";

export interface ThemeDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** `study` skins are offered only while STUDY_THEMES_ENABLED is on. */
  readonly status: "live" | "study";
  readonly appearance: "light" | "dark";
  /** Faces for body copy, display type, and figures. */
  readonly fonts: Readonly<Record<FontSlot, FontId>>;
  readonly text: ThemeText;
  readonly radiusRem: number;
  /** The theme's own appearance. */
  readonly colors: ThemeColors;
  /** Companion palette applied under `.dark`, when the theme has one. */
  readonly darkColors?: ThemeColors;
  readonly effects: {
    /** Background of `.gm-landing-atmosphere` marketing surfaces. */
    readonly landingAtmosphere: string;
  };
  /** Browser and OS chrome. */
  readonly themeColor: string;
  readonly backgroundColor: string;
  readonly statusBarStyle: "default" | "black-translucent";
  /** Component variants the theme selects. */
  readonly completionMark: CompletionMarkKind;
  readonly tabChrome: TabChromeKind;
  /** Re-map saved goal colors onto the theme's palette. */
  readonly remapDisplayColors: boolean;
}

function kebab(role: string) {
  return role.replace(/([A-Z]|\d+)/g, "-$1").toLowerCase();
}

export function colorRoleVariable(role: ColorRole): `--${string}` {
  return (SURFACE_COLOR_ROLES as readonly string[]).includes(role)
    ? `--${kebab(role)}`
    : `--gm-${kebab(role)}`;
}

/** Tailwind color name for roles that have utilities (`bg-<name>`). */
export function colorRoleUtility(role: SurfaceColorRole | AppColorRole): string {
  return kebab(role);
}
