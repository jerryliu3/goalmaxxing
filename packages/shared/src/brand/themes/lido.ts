import { studyTheme } from "./study";

/** Lido: a /ux/brand study skin (exploration). */
export const LIDO_THEME = studyTheme({
  id: "lido",
  label: "Lido",
  description: "An endless-summer pool club: glazed tile, canvas stripes, enamel signs.",
  appearance: "light",
  fonts: { sans: "dm-sans", display: "dela-gothic-one", mono: "ibm-plex-mono" },
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
  radiusPx: 2,
  palette: {
    page: "#e8f2ec",
    surface: "#85cec1",
    ink: "#153e6e",
    surfaceInk: "#163e48",
    muted: "#456a78",
    primary: "#134fc7",
    onPrimary: "#fffbe8",
    secondHue: "#f28c68",
    onSecondHue: "#4e251b",
    border: "#849fa5",
  },
  pageBackgroundImage: "none",
});
