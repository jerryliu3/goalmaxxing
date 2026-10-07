import { studyTheme } from "./study";

/** Opaline: a /ux/brand study skin (shortlisted). */
export const OPALINE_THEME = studyTheme({
  id: "opaline",
  label: "Opaline",
  description: "Light held in colored glass: lilac, plum, and sea-glass teal.",
  appearance: "light",
  fonts: { sans: "dm-sans", display: "instrument-serif", mono: "ibm-plex-mono" },
  // Single-weight display face, so every display role stays at 400.
  text: {
    wordmark: { slot: "display", weight: 400 },
    hero: { slot: "display", weight: 400 },
    title: { slot: "display", weight: 400 },
    heading: { slot: "display", weight: 400 },
    item: { slot: "display", weight: 400 },
    eyebrow: { slot: "sans", weight: 600, trackingEm: 0.12 },
    stat: { slot: "display", weight: 400 },
    figure: { slot: "sans", weight: 400 },
  },
  radiusPx: 20,
  palette: {
    page: "#e8e3f2",
    surface: "#ccc8e9",
    ink: "#4f2a60",
    surfaceInk: "#462455",
    muted: "#735f83",
    primary: "#663166",
    onPrimary: "#fff2f6",
    secondHue: "#86d6ce",
    onSecondHue: "#164e4a",
    border: "#b7accb",
  },
  pageBackgroundImage: "linear-gradient(125deg, #e8e3f2, #f3ecee 60%, #d9eee7)",
});
