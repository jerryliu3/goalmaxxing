import { studyTheme } from "./study";

/** Centre Court: a /ux/brand study skin (shortlisted). */
export const COURT_THEME = studyTheme({
  id: "court",
  label: "Centre Court",
  description: "The everyday sporting club: chalk, club green, and tennis-ball yellow.",
  appearance: "light",
  fonts: { sans: "dm-sans", display: "antonio", mono: "ibm-plex-mono" },
  text: {
    wordmark: { slot: "display", weight: 600 },
    hero: { slot: "display", weight: 500 },
    title: { slot: "display", weight: 500 },
    heading: { slot: "display", weight: 500 },
    item: { slot: "display", weight: 400 },
    eyebrow: { slot: "sans", weight: 600, trackingEm: 0.12 },
    stat: { slot: "display", weight: 500 },
    figure: { slot: "sans", weight: 400 },
  },
  radiusPx: 1,
  palette: {
    page: "#f0f0d9",
    surface: "#174e3c",
    ink: "#183f31",
    surfaceInk: "#f4f2dc",
    muted: "#50644a",
    primary: "#174e3c",
    onPrimary: "#f4f2dc",
    secondHue: "#dced65",
    onSecondHue: "#244224",
    border: "#a7b496",
  },
  pageBackgroundImage: "none",
});
