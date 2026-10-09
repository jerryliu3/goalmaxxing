import type { CSSProperties } from "react";
import { COLOR_LIBRARY, getTheme, type ColorId, type ThemeId } from "@cadence/shared/brand";

/**
 * Second hue study model. A "job" is what a colored mark tells the user; a
 * "tone" is which theme color does that job. Mixes are the hypotheses the
 * lab compares. Everything here is study data, not a production contract.
 */

export type HueJob = "act" | "place" | "pick" | "today" | "done" | "focus";
export type HueTone = "identity" | "second" | "ink";
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
    label: "Focus and drafts",
    question: "What is being edited?",
    surfaces: "Focus ring, unsaved draft tile",
  },
];

export const HUE_TONES: readonly { id: HueTone; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "second", label: "Second" },
  { id: "ink", label: "Ink" },
];

/** Production today: identity does every job and navigation marks in ink. */
export const SHIPPED_MIX: HueMix = {
  act: "identity",
  place: "ink",
  pick: "identity",
  today: "identity",
  done: "identity",
  focus: "identity",
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
    premise:
      "As shipped. Identity does every job; navigation marks the destination in ink.",
    mix: SHIPPED_MIX,
  },
  {
    id: "selection",
    name: "Selection",
    premise:
      "PR #1161. The second hue marks navigation, in-page tabs, and the view switcher. Everything else stays identity.",
    mix: { ...SHIPPED_MIX, place: "second" },
  },
  {
    id: "containers",
    name: "Containers",
    premise:
      "The second hue sits behind what is selected (destination, view, chips, selected row), as Material 3's secondary container does. Today, focus, actions, and completion stay identity.",
    mix: { ...SHIPPED_MIX, place: "second", pick: "second" },
  },
  {
    id: "state",
    name: "Where and when",
    premise:
      "Identity is for doing and earning. The second hue carries state: destination, selection, today, focus.",
    mix: {
      act: "identity",
      place: "second",
      pick: "second",
      today: "second",
      done: "identity",
      focus: "second",
    },
  },
  {
    id: "reward",
    name: "Reward",
    premise:
      "The second hue is what you earn: completion and progress. Navigation stays ink; actions and selection stay identity.",
    mix: { ...SHIPPED_MIX, done: "second" },
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

// --- Second hue candidates ---------------------------------------------

/** A second hue in its three forms: a fill, the label on it, a line on the page. */
export interface SecondHue {
  fill: string;
  onFill: string;
  line: string;
}

export type SecondHueForm = "registry" | "shade" | "solid" | "tint";

export interface SecondHueCandidate {
  id: string;
  name: string;
  form: SecondHueForm;
  note: string;
  /** Explicit triad; registry candidates derive theirs from the theme. */
  hue?: SecondHue;
}

function libraryTint(id: ColorId, line: "pigment" | "ink" = "ink"): SecondHue {
  const swatch = COLOR_LIBRARY[id] as { surface: string; ink: string; pigment?: string };
  return {
    fill: swatch.surface,
    onFill: swatch.ink,
    line: line === "pigment" && swatch.pigment ? swatch.pigment : swatch.ink,
  };
}

function solid(fill: string, onFill: string): SecondHue {
  return { fill, onFill, line: fill };
}

const REGISTRY: SecondHueCandidate = {
  id: "registry",
  name: "Registry",
  form: "registry",
  note: "The theme's own selection pair; its line is darkened toward ink where the hue is too light to draw with.",
};

const SHADE: SecondHueCandidate = {
  id: "shade",
  name: "Shade",
  form: "shade",
  note: "The identity itself washed toward the page: one color family in two strengths, with ink labels.",
};

/** Share of identity in a shade fill; dark pages need more to read as a color. */
const SHADE_AMOUNT = { light: 0.18, dark: 0.4 } as const;

const EXTRA_CANDIDATES: Partial<Record<ThemeId, readonly SecondHueCandidate[]>> = {
  original: [
    {
      id: "teal",
      name: "Teal",
      form: "solid",
      note: "Cool partner at the same lightness as blue; told apart by hue alone. Close to gain green.",
      hue: solid("#0f766e", "#ffffff"),
    },
    {
      id: "violet",
      name: "Violet",
      form: "solid",
      note: "Strong and distinct from blue, but it shares a family with Personal ultraviolet.",
      hue: solid("#6d28d9", "#ffffff"),
    },
    {
      id: "petroleum",
      name: "Petroleum tint",
      form: "tint",
      note: "Library petroleum: pale fill, deep ink. Differs from blue by lightness as well as hue.",
      hue: libraryTint("petroleum", "pigment"),
    },
    {
      id: "tangerine",
      name: "Tangerine tint",
      form: "tint",
      note: "Warm complement to blue. Near the recovery yellow and Other saffron.",
      hue: libraryTint("tangerine"),
    },
    {
      id: "lilac",
      name: "Silver lilac tint",
      form: "tint",
      note: "Barely a hue: a quiet state color that leaves blue as the only loud color.",
      hue: libraryTint("silver-lilac"),
    },
  ],
  gazetteer: [
    {
      id: "deep-sage",
      name: "Deep sage",
      form: "solid",
      note: "PR #1161's deeper sage: cream labels pass, but it sits at rust's lightness.",
      hue: solid("#526456", "#f8f1e3"),
    },
    {
      id: "prussian",
      name: "Prussian",
      form: "solid",
      note: "From the hue contrast study: harbor water against stamp rust.",
      hue: solid("#2c6470", "#f8f1e3"),
    },
    {
      id: "pistachio",
      name: "Pistachio tint",
      form: "tint",
      note: "Mineral Candy pistachio as a pale sage: reads as paper with a cast, not a second ink.",
      hue: libraryTint("mineral-candy-pistachio"),
    },
    {
      id: "glacier",
      name: "Glacier tint",
      form: "tint",
      note: "Sorbet glacier: cool water on warm paper, with a deep teal line.",
      hue: libraryTint("sorbet-glacier"),
    },
  ],
};

export function secondHueCandidates(themeId: ThemeId): readonly SecondHueCandidate[] {
  return [REGISTRY, SHADE, ...(EXTRA_CANDIDATES[themeId] ?? [])];
}

/** The lightest blend of `fill` toward `ink` that reads as a line on `page`. */
function lineFor(fill: string, page: string, ink: string) {
  for (let step = 0; step <= 10; step += 1) {
    const candidate = mixHex(ink, fill, step / 10);
    if (contrastRatio(candidate, page) >= LINE_CONTRAST) return candidate;
  }
  return ink;
}

export function resolveSecondHue(themeId: ThemeId, candidateId: string): SecondHue {
  const candidate =
    secondHueCandidates(themeId).find((option) => option.id === candidateId) ?? REGISTRY;
  if (candidate.hue) return candidate.hue;
  const page = themeHex(themeId, "page") ?? "#ffffff";
  const ink = themeHex(themeId, "foreground") ?? "#000000";
  if (candidate.form === "shade") {
    const identity = themeHex(themeId, "primary") ?? ink;
    const lightPage = contrastRatio(page, "#000000") > contrastRatio(page, "#ffffff");
    return {
      fill: mixHex(identity, page, lightPage ? SHADE_AMOUNT.light : SHADE_AMOUNT.dark),
      onFill: ink,
      line: lineFor(identity, page, ink),
    };
  }
  const fill = themeHex(themeId, "selection") ?? ink;
  return {
    fill,
    onFill: themeHex(themeId, "selectionForeground") ?? page,
    line: lineFor(fill, page, ink),
  };
}

export interface HueReadout {
  /** Identity as a rule or mark on the page. */
  identityLine: number;
  /** Second hue fill as a rule or mark on the page, before any line fallback. */
  fillLine: number;
  /** The line form actually used for rules and marks. */
  secondLine: number;
  /** Selection label on the second hue fill. */
  secondLabel: number;
  /** Lightness separation between identity and the second fill (1 = hue only). */
  separation: number;
}

export function hueReadout(themeId: ThemeId, hue: SecondHue): HueReadout {
  const page = themeHex(themeId, "page") ?? "#ffffff";
  const identity = themeHex(themeId, "primary") ?? page;
  return {
    identityLine: contrastRatio(identity, page),
    fillLine: contrastRatio(hue.fill, page),
    secondLine: contrastRatio(hue.line, page),
    secondLabel: contrastRatio(hue.onFill, hue.fill),
    separation: contrastRatio(identity, hue.fill),
  };
}

// --- CSS variables ----------------------------------------------------------

const TONE_VARIABLES: Record<HueTone, { fill: string; on: string; line: string }> = {
  identity: {
    fill: "var(--hue-identity)",
    on: "var(--hue-identity-on)",
    line: "var(--hue-identity)",
  },
  second: {
    fill: "var(--hue-second)",
    on: "var(--hue-second-on)",
    line: "var(--hue-second-line)",
  },
  ink: { fill: "var(--hue-ink)", on: "var(--hue-ink-on)", line: "var(--hue-ink)" },
};

/**
 * Variables for a board root that also carries `data-ui-style`: it captures
 * the theme's identity and ink before descendants re-point `--primary`, then
 * exposes `--job-<job>-fill|on|line` for every job.
 */
export function hueBoardStyle(mix: HueMix, hue: SecondHue): CSSProperties {
  const variables: Record<string, string> = {
    "--hue-identity": "var(--primary)",
    "--hue-identity-on": "var(--primary-foreground)",
    "--hue-ink": "var(--foreground)",
    "--hue-ink-on": "var(--background)",
    "--hue-second": hue.fill,
    "--hue-second-on": hue.onFill,
    "--hue-second-line": hue.line,
  };
  for (const job of HUE_JOBS) {
    const tone = TONE_VARIABLES[mix[job.id]];
    variables[`--job-${job.id}-fill`] = tone.fill;
    variables[`--job-${job.id}-on`] = tone.on;
    variables[`--job-${job.id}-line`] = tone.line;
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
