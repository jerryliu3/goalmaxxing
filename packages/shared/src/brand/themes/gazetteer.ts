import { GAZETTEER, GAZETTEER_HEATMAP_SCALE } from "../gazetteer";
import { DEFAULT_GHOST_COLORS, type ThemeDefinition } from "../roles";

/** Stamp washed toward the page: 18% on paper, 40% on the dark page. */
const GAZETTEER_SHADE = { light: "#ead9cc", dark: "#614433" } as const;

/**
 * The surveyor's ledger: warm paper, walnut ink, stamp rust and its shade,
 * Newsreader names, Source Sans 3 labels and figures, Nest marks. Swatches
 * shared with category and planner colors come from the GAZETTEER palette.
 *
 * Native reads the surface roles plus page/gain/recover, so those stay hex.
 */
export const GAZETTEER_THEME = {
  id: "gazetteer",
  label: "Gazetteer",
  description: "Warm paper and ink, with serif goal names and rust accents.",
  status: "live",
  appearance: "light",
  fonts: { sans: "source-sans-3", display: "newsreader", mono: "ibm-plex-mono" },
  // Newsreader names everything; regular weight below the page title, as in
  // the study kit. Source Sans 3 carries labels and small figures alike.
  text: {
    wordmark: { slot: "display", weight: 600 },
    hero: { slot: "display", weight: 600 },
    title: { slot: "display", weight: 500 },
    heading: { slot: "display", weight: 400 },
    item: { slot: "display", weight: 400 },
    eyebrow: { slot: "sans", weight: 600, trackingEm: 0.12 },
    stat: { slot: "display", weight: 400 },
    figure: { slot: "sans", weight: 400 },
  },
  radiusRem: 0.75,
  // Warm near-white canvas with white cards; the paper tone (#f3ead8) is the
  // muted fill for tracks, inputs, and panels, so regions separate.
  colors: {
    background: "#fffdf8",
    foreground: GAZETTEER.ink,
    card: "#ffffff",
    cardForeground: GAZETTEER.ink,
    popover: "#ffffff",
    popoverForeground: GAZETTEER.ink,
    primary: GAZETTEER.stamp,
    primaryForeground: GAZETTEER.paper,
    secondary: "#e4e4e7",
    secondaryForeground: "#3f3f46",
    muted: "#f3ead8",
    mutedForeground: GAZETTEER.muted,
    accent: "#e8d9c0",
    accentForeground: GAZETTEER.ink,
    destructive: "#e2352e",
    border: "#e4d7bf",
    input: GAZETTEER.rule,
    ring: GAZETTEER.stamp,
    page: "#fbf7ef",
    gain: GAZETTEER.gain,
    recover: GAZETTEER.recover,
    warning: GAZETTEER.recover,
    warningFill: "#fef9c3",
    // No second hue: where you are and what you picked share the stamp
    // shade (rust 18% over the page), with ink labels and rust rules.
    selection: GAZETTEER_SHADE.light,
    selectionForeground: "var(--foreground)",
    selectionLine: "var(--primary)",
    today: "var(--gm-heatmap-1)",
    todayForeground: "var(--foreground)",
    daySelected: GAZETTEER_SHADE.light,
    daySelectedForeground: "var(--foreground)",
    // Opaque Zinc 300, one step darker than Original so the grey reads on paper.
    adjacent: "#d4d4d8",
    adjacentForeground: "oklch(0.36 0.01 286)",
    stampLight: GAZETTEER.stampLight,
    ...DEFAULT_GHOST_COLORS,
    heatmap0: GAZETTEER_HEATMAP_SCALE[0],
    heatmap1: "color-mix(in srgb, var(--primary) 28%, var(--background))",
    heatmap2: "var(--gm-stamp-light)",
    heatmap3: "var(--primary)",
    heatmap4: GAZETTEER_HEATMAP_SCALE[4],
  },
  darkColors: {
    background: "#1c1610",
    foreground: "#f3ead8",
    card: GAZETTEER.ink,
    cardForeground: "#f3ead8",
    popover: GAZETTEER.ink,
    popoverForeground: "#f3ead8",
    primary: GAZETTEER.stampLight,
    primaryForeground: "#1c1610",
    secondary: "#3f3f46",
    secondaryForeground: "#e4e4e7",
    muted: "#2a2218",
    mutedForeground: "#c4b49a",
    accent: "#3a2f24",
    accentForeground: "#f3ead8",
    destructive: "#ff6a65",
    border: GAZETTEER.mutedDeep,
    input: GAZETTEER.mutedDeep,
    ring: GAZETTEER.stampLight,
    page: "#1c1610",
    gain: "#8aa37a",
    recover: "#facc15",
    warning: "#facc15",
    warningFill: "color-mix(in srgb, #facc15 22%, var(--background))",
    selection: GAZETTEER_SHADE.dark,
    selectionForeground: "var(--foreground)",
    selectionLine: "var(--primary)",
    today: "var(--gm-heatmap-1)",
    todayForeground: "var(--foreground)",
    daySelected: GAZETTEER_SHADE.dark,
    daySelectedForeground: "var(--foreground)",
    adjacent: "#52525b",
    adjacentForeground: "oklch(0.92 0.003 286)",
    stampLight: "#8a5a40",
    ...DEFAULT_GHOST_COLORS,
    heatmap0: "#2a2218",
    heatmap1: "color-mix(in srgb, var(--gm-stamp-light) 70%, var(--background))",
    heatmap2: "var(--gm-stamp-light)",
    heatmap3: "var(--primary)",
    heatmap4: "#e2c4b0",
  },
  effects: {
    landingAtmosphere: [
      "radial-gradient(1200px circle at 12% -8%, rgba(154, 79, 44, 0.12), transparent 55%)",
      "radial-gradient(900px circle at 92% 6%, rgba(212, 196, 164, 0.55), transparent 52%)",
      "radial-gradient(800px circle at 78% 88%, rgba(74, 103, 64, 0.12), transparent 50%)",
    ].join(", "),
  },
  themeColor: "#fbf7ef",
  backgroundColor: "#fbf7ef",
  statusBarStyle: "black-translucent",
  completionMark: "nest",
  tabChrome: "underline",
  remapDisplayColors: true,
} as const satisfies ThemeDefinition;
