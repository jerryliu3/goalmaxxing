import { studyTheme } from "./study";

/** Pitlane: a /ux/brand study skin (shortlisted). */
export const PITLANE_THEME = studyTheme({
  id: "pitlane",
  label: "Pitlane",
  description: "Kinetic and engineered: asphalt, cobalt enamel, and timing-strip lime.",
  appearance: "dark",
  fonts: { sans: "dm-sans", display: "barlow-condensed", mono: "ibm-plex-mono" },
  text: {
    wordmark: { slot: "display", weight: 800 },
    hero: { slot: "display", weight: 800 },
    title: { slot: "display", weight: 700 },
    heading: { slot: "display", weight: 600 },
    item: { slot: "display", weight: 600 },
    eyebrow: { slot: "sans", weight: 600, trackingEm: 0.12 },
    stat: { slot: "display", weight: 700 },
    figure: { slot: "sans", weight: 400 },
  },
  radiusPx: 0,
  palette: {
    page: "#151819",
    surface: "#deef79",
    ink: "#f0ede1",
    surfaceInk: "#232b19",
    muted: "#afb6b5",
    primary: "#385acc",
    onPrimary: "#f5f7ff",
    secondHue: "#deef79",
    onSecondHue: "#2b3314",
    border: "#575d5c",
  },
  pageBackgroundImage: "linear-gradient(124deg, transparent 78%, #323537 78% 79%, transparent 79%)",
});
