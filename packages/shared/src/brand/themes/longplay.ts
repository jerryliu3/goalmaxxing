import { studyTheme } from "./study";

/** Longplay: a /ux/brand study skin (exploration). */
export const LONGPLAY_THEME = studyTheme({
  id: "longplay",
  label: "Longplay",
  description: "A warm listening room: cherry lacquer, sleeve paper, amber dials.",
  appearance: "dark",
  fonts: { sans: "dm-sans", display: "bodoni-moda", mono: "ibm-plex-mono" },
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
  radiusPx: 3,
  palette: {
    page: "#2c171d",
    surface: "#f0d5bc",
    ink: "#f7e3ce",
    surfaceInk: "#4a232c",
    muted: "#d8b6ab",
    primary: "#efbb71",
    onPrimary: "#40241b",
    secondHue: "#d77e87",
    onSecondHue: "#38151e",
    border: "#8c686b",
  },
  pageBackgroundImage: "linear-gradient(120deg, #35161e, #271519 65%)",
});
