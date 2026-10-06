import { studyTheme } from "./study";

/** Fieldwork: a /ux/brand study skin (exploration). */
export const FIELDWORK_THEME = studyTheme({
  id: "fieldwork",
  label: "Fieldwork",
  description: "Rugged and purposeful: woven canvas, stitched labels, brass hardware.",
  appearance: "dark",
  fonts: { sans: "dm-sans", display: "oswald", mono: "ibm-plex-mono" },
  text: {
    wordmark: { slot: "display", weight: 700 },
    hero: { slot: "display", weight: 700 },
    title: { slot: "display", weight: 700 },
    heading: { slot: "display", weight: 600 },
    item: { slot: "display", weight: 500 },
    eyebrow: { slot: "sans", weight: 600, trackingEm: 0.12 },
    stat: { slot: "display", weight: 700 },
    figure: { slot: "sans", weight: 400 },
  },
  radiusPx: 3,
  palette: {
    page: "#252e23",
    surface: "#354432",
    ink: "#eae2cc",
    surfaceInk: "#e7dfc9",
    muted: "#bdc4aa",
    primary: "#d8b96c",
    onPrimary: "#332b18",
    secondHue: "#a2bdc9",
    onSecondHue: "#243a42",
    border: "#7f8b72",
  },
  pageBackgroundImage: "repeating-linear-gradient(90deg, #e5dcc609 0 1px, transparent 1px 4px)",
});
