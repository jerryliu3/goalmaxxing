import { studyTheme } from "./study";

/** Bloodstone: a /ux/brand study skin (shortlisted). */
export const BLOODSTONE_THEME = studyTheme({
  id: "bloodstone",
  label: "Bloodstone",
  description: "Monumental and cinematic: oxblood, bone, and cold steel blue.",
  appearance: "dark",
  fonts: { sans: "dm-sans", display: "playfair-display", mono: "ibm-plex-mono" },
  text: {
    wordmark: { slot: "display", weight: 900 },
    hero: { slot: "display", weight: 900 },
    title: { slot: "display", weight: 700 },
    heading: { slot: "display", weight: 600 },
    item: { slot: "display", weight: 500 },
    eyebrow: { slot: "sans", weight: 600, trackingEm: 0.12 },
    stat: { slot: "display", weight: 700 },
    figure: { slot: "sans", weight: 400 },
  },
  radiusPx: 0,
  palette: {
    page: "#130f12",
    surface: "#5b1d2c",
    ink: "#f2e5d5",
    surfaceInk: "#f4dfc8",
    muted: "#c7afa8",
    primary: "#a92f40",
    onPrimary: "#fff1e3",
    secondHue: "#a8bed2",
    onSecondHue: "#213546",
    border: "#765258",
  },
  // Steel blue reads 3.4× louder than the oxblood on this page; navigation stays red.
  selection: "primary",
  pageBackgroundImage: "radial-gradient(ellipse at 72% 23%, #35151d, #130f12 60%)",
});
