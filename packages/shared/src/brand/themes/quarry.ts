import { studyTheme } from "./study";

/** Quarry: a /ux/brand study skin (exploration). */
export const QUARRY_THEME = studyTheme({
  id: "quarry",
  label: "Quarry",
  description: "Raw and architectural: raw concrete, fractured edges, survey blue.",
  appearance: "light",
  fonts: { sans: "dm-sans", display: "archivo-black", mono: "ibm-plex-mono" },
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
  radiusPx: 0,
  palette: {
    page: "#d8d3c7",
    surface: "#292d29",
    ink: "#282a24",
    surfaceInk: "#e9e3d4",
    muted: "#585b50",
    primary: "#943c2e",
    onPrimary: "#fff0d9",
    secondHue: "#244fc3",
    onSecondHue: "#f0f1ff",
    border: "#97998a",
  },
  pageBackgroundImage: "repeating-linear-gradient(173deg, transparent 0 19px, #292a2405 19px 20px)",
});
