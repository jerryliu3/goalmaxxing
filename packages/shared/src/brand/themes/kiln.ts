import { studyTheme } from "./study";

/** Kiln: a /ux/brand study skin (shortlisted). */
export const KILN_THEME = studyTheme({
  id: "kiln",
  label: "Kiln",
  description: "Fired earth and cobalt glaze: clay page, bisque cards, kiln-orange actions.",
  appearance: "dark",
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
  radiusPx: 4,
  palette: {
    page: "#38201f",
    surface: "#f2dfbe",
    ink: "#f7e5d0",
    surfaceInk: "#4b2924",
    muted: "#dcbaa7",
    primary: "#f49d68",
    onPrimary: "#482019",
    secondHue: "#a8c1f5",
    onSecondHue: "#20395d",
    border: "#916559",
  },
  pageBackgroundImage: "radial-gradient(ellipse at 100% 0%, #8e43273b, transparent 60%)",
});
