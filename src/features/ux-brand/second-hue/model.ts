import type { CSSProperties } from "react";
import { getTheme, type ThemeId } from "@cadence/shared/brand";

/**
 * Second hue study model. A "job" is what a colored mark tells the user; a
 * "tone" is which theme color does that job, at which strength. Each theme
 * has an identity, a shade (the identity at tint strength), and an optional
 * accent that can be drawn solid or as a tint. Mixes are the hypotheses the
 * lab compares. Everything here is study data, not a production contract.
 */

export type HueJob = "act" | "place" | "pick" | "today" | "done" | "focus";
export type HueTone = "identity" | "shade" | "shadeOrSolid" | "accent" | "accentTint" | "ink";
export type HueMix = Readonly<Record<HueJob, HueTone>>;

export interface HueJobInfo {
  id: HueJob;
  label: string;
  question: string;
  surfaces: string;
}

export const HUE_JOBS: readonly HueJobInfo[] = [
  {
    id: "act",
    label: "Act",
    question: "What will this do?",
    surfaces: "Primary, outline, and link buttons",
  },
  {
    id: "place",
    label: "Where you are",
    question: "Which destination or view is open?",
    surfaces: "App tabs, in-page tabs, view switcher",
  },
  {
    id: "pick",
    label: "What you picked",
    question: "What is chosen right now?",
    surfaces: "Selected day and row, picker chips, filter checks",
  },
  {
    id: "today",
    label: "Now",
    question: "Where is today?",
    surfaces: "Today in the week strip and month grid",
  },
  {
    id: "done",
    label: "Done",
    question: "What has been earned?",
    surfaces: "Completion marks, progress bar, completed badge",
  },
  {
    id: "focus",
    label: "Focus",
    question: "What is being edited?",
    surfaces: "Focus ring on inputs, task quick-add",
  },
];

export const HUE_TONES: readonly { id: HueTone; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "shade", label: "Shade" },
  { id: "shadeOrSolid", label: "Shade or solid" },
  { id: "accent", label: "Accent" },
  { id: "accentTint", label: "Accent tint" },
  { id: "ink", label: "Ink" },
];

/** Production before the second hue: identity does every job and navigation marks in ink. */
export const SHIPPED_MIX: HueMix = {
  act: "identity",
  place: "ink",
  pick: "identity",
  today: "identity",
  done: "identity",
  focus: "identity",
};

/**
 * The lab's current proposal: the accent marks where you are; what you
 * picked sits in the shade, going solid where the shade would vanish into the
 * card; identity keeps doing, now, done, and focus. Planner drafts keep their
 * category colors and take no theme color.
 */
export const PROPOSED_MIX: HueMix = {
  ...SHIPPED_MIX,
  place: "accent",
  pick: "shadeOrSolid",
};

export interface HueMixOption {
  id: string;
  name: string;
  premise: string;
  mix: HueMix;
}

export const HUE_MIXES: readonly HueMixOption[] = [
  {
    id: "shipped",
    name: "One hue",
    premise: "Before the second hue shipped. Identity does every job; navigation marks the destination in ink.",
    mix: SHIPPED_MIX,
  },
  {
    id: "selection-solid",
    name: "Selection · solid",
    premise: "PR #1161 as built: the accent at full strength marks where you are.",
    mix: { ...SHIPPED_MIX, place: "accent" },
  },
  {
    id: "selection-tint",
    name: "Selection · tint",
    premise: "Same jobs, accent washed toward the page with ink labels. Compare with solid to judge strength alone.",
    mix: { ...SHIPPED_MIX, place: "accentTint" },
  },
  {
    id: "selection-shade",
    name: "Selection · shade",
    premise: "No new color: the identity at tint strength marks where you are.",
    mix: { ...SHIPPED_MIX, place: "shade" },
  },
  {
    id: "containers-shade",
    name: "Containers · shade",
    premise: "Shade also sits behind what you picked: selected row, chips, filters. One color family throughout.",
    mix: { ...SHIPPED_MIX, place: "shade", pick: "shade" },
  },
  {
    id: "proposal",
    name: "Proposal · shipped",
    premise:
      "What production ships. Accent marks where you are; shade sits behind what you picked, solid where it would vanish. Original, Gazetteer, and Bloodstone drop the accent.",
    mix: PROPOSED_MIX,
  },
];

export function matchingMixId(mix: HueMix): string | null {
  const match = HUE_MIXES.find((option) =>
    HUE_JOBS.every((job) => option.mix[job.id] === mix[job.id])
  );
  return match?.id ?? null;
}

// --- Color math -----------------------------------------------------------

type Rgb = readonly [number, number, number];

function parseHex(value: string): Rgb | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : match[1];
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)) as unknown as Rgb;
}

function encode(linear: number) {
  const clamped = Math.min(1, Math.max(0, linear));
  const srgb = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(srgb * 255);
}

function decode(channel: number) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function parseOklch(value: string): Rgb | null {
  const match = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/i.exec(value.trim());
  if (!match) return null;
  const [lightness, chroma, hue] = match.slice(1).map(Number);
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

function toHex(rgb: Rgb) {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function luminance([red, green, blue]: Rgb) {
  return 0.2126 * decode(red) + 0.7152 * decode(green) + 0.0722 * decode(blue);
}

/** WCAG contrast ratio between two hex colors. */
export function contrastRatio(first: string, second: string): number {
  const a = parseHex(first);
  const b = parseHex(second);
  if (!a || !b) return Number.NaN;
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

function mixHex(color: string, base: string, amount: number) {
  const top = parseHex(color);
  const bottom = parseHex(base);
  if (!top || !bottom) return color;
  return toHex(top.map((channel, index) => Math.round(channel * amount + bottom[index] * (1 - amount))) as unknown as Rgb);
}

/** Non-text contrast floor for rules, rings, and marks. */
export const LINE_CONTRAST = 3;
/** Text contrast floor for a label on a filled selection. */
export const LABEL_CONTRAST = 4.5;

type ColorKey = keyof ReturnType<typeof getTheme>["colors"];

function roleFromVariable(variable: string): ColorKey {
  const name = variable.replace(/^--(gm-)?/, "");
  return name.replace(/-([a-z0-9])/g, (_, next: string) => next.toUpperCase()) as ColorKey;
}

/** A theme role as hex, following `var(--role)` references. Null for color-mix. */
export function themeHex(themeId: ThemeId, role: ColorKey, depth = 0): string | null {
  const value: string = getTheme(themeId).colors[role];
  const reference = /^var\((--[a-z0-9-]+)\)$/i.exec(value.trim());
  if (reference) return depth > 4 ? null : themeHex(themeId, roleFromVariable(reference[1]), depth + 1);
  const rgb = parseHex(value) ?? parseOklch(value);
  return rgb ? toHex(rgb) : null;
}

// --- Theme palette ----------------------------------------------------------

/** A fill and the label drawn on it. */
export interface Swatch {
  fill: string;
  onFill: string;
}

/** Everything a board needs beyond the identity and ink it reads from the theme. */
export interface HuePalette {
  shade: Swatch;
  /** The shade, or solid identity where the shade does not separate from the card. */
  selected: Swatch;
  accent: Swatch & { line: string };
  accentTint: Swatch;
  /** False when the theme has no accent: solid accent jobs use `selected`, tint ones the shade. */
  hasAccent: boolean;
}

export interface AccentCandidate {
  id: string;
  name: string;
  note: string;
  /** Solid accent; registry and none derive theirs from the theme. */
  fill?: string;
  /** Label on the solid fill; defaults to the theme's ink. */
  onFill?: string;
  /** Authored tint; defaults to the fill washed toward the page. */
  tintFill?: string;
}

const REGISTRY: AccentCandidate = {
  id: "registry",
  name: "Registry",
  note: "The theme's own selection pair.",
};

const NO_ACCENT: AccentCandidate = {
  id: "none",
  name: "No accent",
  note: "Identity and shade only: accent jobs use the shade, solid where it would vanish into the card.",
};

const EXTRA_ACCENTS: Partial<Record<ThemeId, readonly AccentCandidate[]>> = {
  original: [
    {
      id: "teal",
      name: "Teal",
      note: "Cool partner at blue's lightness; told apart by hue alone. Close to gain green.",
      fill: "#0f766e",
      onFill: "#ffffff",
    },
    {
      id: "violet",
      name: "Violet",
      note: "Strong and distinct from blue, but it shares a family with Personal ultraviolet.",
      fill: "#6d28d9",
      onFill: "#ffffff",
    },
    {
      id: "petroleum",
      name: "Petroleum",
      note: "Library petroleum: a blue-green neighbor that stays in Original's cool family.",
      fill: "#246b78",
      onFill: "#ffffff",
      tintFill: "#c8e3e4",
    },
    {
      id: "tangerine",
      name: "Tangerine",
      note: "Warm complement to blue. Near the recovery yellow and Other saffron.",
      fill: "#f69729",
      tintFill: "#ffe9c6",
    },
  ],
  gazetteer: [
    {
      id: "deep-sage",
      name: "Deep sage",
      note: "PR #1161's deeper sage: cream labels pass, but it sits at rust's lightness.",
      fill: "#526456",
      onFill: "#f8f1e3",
    },
    {
      id: "prussian",
      name: "Prussian",
      note: "From the hue contrast study: harbor water against stamp rust.",
      fill: "#2c6470",
      onFill: "#f8f1e3",
    },
    {
      id: "pistachio",
      name: "Pistachio",
      note: "Mineral Candy pistachio: an olive ink with a pale sage tint.",
      fill: "#394823",
      onFill: "#f8f1e3",
      tintFill: "#c5d49a",
    },
  ],
  pitlane: [
    {
      id: "lime-tint",
      name: "Lime, toned down",
      note: "The registry lime washed toward the page so it stays quieter than the blue.",
      fill: "#656e3f",
    },
  ],
};

/** Accents the proposal loads: tonal themes drop theirs; the rest keep the registry pair. */
export const PROPOSED_ACCENTS: Partial<Record<ThemeId, string>> = {
  original: "none",
  gazetteer: "none",
  bloodstone: "none",
};

/** Above this, an accent out-shouts its identity. Advisory: Pitlane keeps a louder lime on purpose. */
export const MAX_ACCENT_LOUDNESS = 1.25;

/** Below this contrast against the card, a shade reads as no selection and goes solid. */
export const MIN_SHADE_SEPARATION = 1.2;

export function accentCandidates(themeId: ThemeId): readonly AccentCandidate[] {
  return [REGISTRY, NO_ACCENT, ...(EXTRA_ACCENTS[themeId] ?? [])];
}

/** Share of a color in its tint; dark pages need more to read as a color. */
const TINT_AMOUNT = { light: 0.18, dark: 0.4 } as const;

function isLightPage(page: string) {
  return contrastRatio(page, "#000000") > contrastRatio(page, "#ffffff");
}

/** The lightest blend of `fill` toward `ink` that reads as a line on `page`. */
function lineFor(fill: string, page: string, ink: string) {
  for (let step = 0; step <= 10; step += 1) {
    const candidate = mixHex(ink, fill, step / 10);
    if (contrastRatio(candidate, page) >= LINE_CONTRAST) return candidate;
  }
  return ink;
}

export function resolvePalette(themeId: ThemeId, accentId: string): HuePalette {
  const candidate = accentCandidates(themeId).find((option) => option.id === accentId) ?? REGISTRY;
  const page = themeHex(themeId, "page") ?? "#ffffff";
  const ink = themeHex(themeId, "foreground") ?? "#000000";
  const identity = themeHex(themeId, "primary") ?? ink;
  const amount = isLightPage(page) ? TINT_AMOUNT.light : TINT_AMOUNT.dark;
  const tint = (color: string) => mixHex(color, page, amount);
  const shade = { fill: tint(identity), onFill: ink };
  const card = themeHex(themeId, "card") ?? page;
  const selected =
    contrastRatio(shade.fill, card) >= MIN_SHADE_SEPARATION
      ? shade
      : { fill: identity, onFill: themeHex(themeId, "primaryForeground") ?? page };

  if (candidate.id === NO_ACCENT.id) {
    return {
      shade,
      selected,
      accent: { fill: identity, onFill: themeHex(themeId, "primaryForeground") ?? page, line: identity },
      accentTint: shade,
      hasAccent: false,
    };
  }

  const fill = candidate.fill ?? themeHex(themeId, "selection") ?? identity;
  const onFill =
    candidate.onFill ?? (candidate.fill ? ink : (themeHex(themeId, "selectionForeground") ?? page));
  return {
    shade,
    selected,
    accent: { fill, onFill, line: lineFor(fill, page, ink) },
    accentTint: { fill: candidate.tintFill ?? tint(fill), onFill: ink },
    hasAccent: true,
  };
}

export interface HueReadout {
  /** Identity as a rule or mark on the page. */
  identityLine: number;
  /** Ink on the shade. */
  shadeLabel: number;
  /** Shade against the card it sits on. */
  shadeSeparation: number;
  /** The accent's line form as a rule or mark on the page. */
  accentLine: number;
  /** Label on the solid accent. */
  accentLabel: number;
  /** Ink on the accent tint. */
  accentTintLabel: number;
  /** Lightness separation between identity and the solid accent (1 = hue only). */
  separation: number;
  /** Accent-to-page contrast over identity-to-page contrast; above 1 the accent is louder. */
  loudness: number;
}

export function hueReadout(themeId: ThemeId, palette: HuePalette): HueReadout {
  const page = themeHex(themeId, "page") ?? "#ffffff";
  const identity = themeHex(themeId, "primary") ?? page;
  return {
    identityLine: contrastRatio(identity, page),
    shadeLabel: contrastRatio(palette.shade.onFill, palette.shade.fill),
    shadeSeparation: contrastRatio(palette.shade.fill, themeHex(themeId, "card") ?? page),
    accentLine: contrastRatio(palette.accent.line, page),
    accentLabel: contrastRatio(palette.accent.onFill, palette.accent.fill),
    accentTintLabel: contrastRatio(palette.accentTint.onFill, palette.accentTint.fill),
    separation: contrastRatio(identity, palette.accent.fill),
    loudness: contrastRatio(palette.accent.fill, page) / contrastRatio(identity, page),
  };
}

// --- CSS variables ----------------------------------------------------------

const TONE_VARIABLES: Record<HueTone, { fill: string; on: string; line: string }> = {
  identity: {
    fill: "var(--hue-identity)",
    on: "var(--hue-identity-on)",
    line: "var(--hue-identity)",
  },
  shade: { fill: "var(--hue-shade)", on: "var(--hue-shade-on)", line: "var(--hue-identity)" },
  shadeOrSolid: {
    fill: "var(--hue-selected)",
    on: "var(--hue-selected-on)",
    line: "var(--hue-identity)",
  },
  accent: { fill: "var(--hue-accent)", on: "var(--hue-accent-on)", line: "var(--hue-accent-line)" },
  accentTint: {
    fill: "var(--hue-accent-tint)",
    on: "var(--hue-accent-tint-on)",
    line: "var(--hue-accent-line)",
  },
  ink: { fill: "var(--hue-ink)", on: "var(--hue-ink-on)", line: "var(--hue-ink)" },
};

/**
 * Variables for a board root that also carries `data-ui-style`: it captures
 * the theme's identity and ink before descendants re-point `--primary`, then
 * exposes `--job-<job>-fill|on|line` for every job.
 */
export function hueBoardStyle(mix: HueMix, palette: HuePalette): CSSProperties {
  const fallback: Partial<Record<HueTone, HueTone>> = palette.hasAccent
    ? {}
    : { accent: "shadeOrSolid", accentTint: "shade" };
  const variables: Record<string, string> = {
    "--hue-identity": "var(--primary)",
    "--hue-identity-on": "var(--primary-foreground)",
    "--hue-ink": "var(--foreground)",
    "--hue-ink-on": "var(--background)",
    "--hue-shade": palette.shade.fill,
    "--hue-shade-on": palette.shade.onFill,
    "--hue-selected": palette.selected.fill,
    "--hue-selected-on": palette.selected.onFill,
    "--hue-accent": palette.accent.fill,
    "--hue-accent-on": palette.accent.onFill,
    "--hue-accent-line": palette.accent.line,
    "--hue-accent-tint": palette.accentTint.fill,
    "--hue-accent-tint-on": palette.accentTint.onFill,
  };
  for (const job of HUE_JOBS) {
    const tone = fallback[mix[job.id]] ?? mix[job.id];
    variables[`--job-${job.id}-fill`] = TONE_VARIABLES[tone].fill;
    variables[`--job-${job.id}-on`] = TONE_VARIABLES[tone].on;
    variables[`--job-${job.id}-line`] = TONE_VARIABLES[tone].line;
  }
  return variables as CSSProperties;
}

/**
 * Re-points `--primary` (and the ring) at a job's tone, so production
 * components that paint with `primary` render in that job's color. Marks and
 * rules take the line form; filled controls take the fill and its label.
 */
export function jobAsPrimary(job: HueJob, form: "fill" | "line"): CSSProperties {
  return {
    "--primary": `var(--job-${job}-${form})`,
    "--primary-foreground": `var(--job-${job}-on)`,
    "--ring": `var(--job-${job}-line)`,
  } as CSSProperties;
}
