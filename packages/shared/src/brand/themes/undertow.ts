import { studyTheme } from "./study";

/** Undertow: a /ux/brand study skin (shortlisted). */
export const UNDERTOW_THEME = studyTheme({
  id: "undertow",
  label: "Undertow",
  description: "Bioluminescent expedition: deep water, pressure glass, luminous points.",
  appearance: "dark",
  fonts: { sans: "dm-sans", display: "space-grotesk", mono: "ibm-plex-mono" },
  text: {
    wordmark: { slot: "display", weight: 500 },
    hero: { slot: "display", weight: 400 },
    title: { slot: "display", weight: 500 },
    heading: { slot: "display", weight: 500 },
    item: { slot: "display", weight: 400 },
    eyebrow: { slot: "sans", weight: 600, trackingEm: 0.12 },
    stat: { slot: "display", weight: 400 },
    figure: { slot: "sans", weight: 400 },
  },
  radiusPx: 14,
  palette: {
    page: "#071c27",
    surface: "#16364a",
    ink: "#e0f6ef",
    surfaceInk: "#e0f6ef",
    muted: "#aec6cf",
    primary: "#72ebc4",
    onPrimary: "#073a32",
    secondHue: "#b4a6ee",
    onSecondHue: "#292146",
    border: "#496673",
  },
  pageBackgroundImage: "radial-gradient(ellipse at 90% 20%, #103b524f, transparent 55%)",
});
