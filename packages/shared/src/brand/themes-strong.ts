import type { BrandThemeDefinition } from "./types";

export const STRONG_THEMES = [
  {
    "id": "bloodstone",
    "name": "Bloodstone",
    "group": "strong",
    "appearance": "dark",
    "status": "shortlisted",
    "concept": {
      "premise": "Monumental / cinematic",
      "materials": "Dark mineral \u00b7 red lacquer \u00b7 steel inlay",
      "geometry": "Monumental serif, mineral facets and steel inlays.",
      "completion": "A solid mark records completion.",
      "composition": "Monumental headline, work list and a weekly progress panel."
    },
    "fonts": {
      "display": "playfair-display",
      "body": "dm-sans",
      "mono": "ibm-plex-mono"
    },
    "display": {
      "weight": 900,
      "letterSpacingEm": -0.045,
      "lineHeight": 0.96,
      "textTransform": "uppercase"
    },
    "palette": {
      "page": "#130F12",
      "surface": "#5B1D2C",
      "ink": "#F2E5D5",
      "surfaceInk": "#F4DFC8",
      "muted": "#C7AFA8",
      "primary": "#A92F40",
      "onPrimary": "#FFF1E3",
      "secondary": "#A8BED2",
      "onSecondary": "#213546",
      "border": "#765258",
      "display": "#CC5157"
    },
    "geometry": {
      "radiusPx": 0,
      "borderWidthPx": 1
    },
    "effects": {
      "pageBackgroundImage": "radial-gradient(ellipse at 72% 23%, #35151d, #130f12 60%)",
      "surfaceBackgroundImage": "none",
      "shadow": "none"
    }
  },
  {
    "id": "pitlane",
    "name": "Pitlane",
    "group": "strong",
    "appearance": "dark",
    "status": "shortlisted",
    "concept": {
      "premise": "Kinetic / engineered",
      "materials": "Painted curb \u00b7 timing strip \u00b7 asphalt",
      "geometry": "Timing strips, slanted panels and cobalt racing enamel.",
      "completion": "A solid mark records completion.",
      "composition": "Monumental headline, work list and a weekly progress panel."
    },
    "fonts": {
      "display": "barlow-condensed",
      "body": "dm-sans",
      "mono": "ibm-plex-mono"
    },
    "display": {
      "weight": 800,
      "letterSpacingEm": -0.045,
      "lineHeight": 0.96,
      "textTransform": "uppercase"
    },
    "palette": {
      "page": "#151819",
      "surface": "#DEEF79",
      "ink": "#F0EDE1",
      "surfaceInk": "#232B19",
      "muted": "#AFB6B5",
      "primary": "#385ACC",
      "onPrimary": "#F5F7FF",
      "secondary": "#DEEF79",
      "onSecondary": "#2B3314",
      "border": "#575D5C",
      "display": "#F0EDE1"
    },
    "geometry": {
      "radiusPx": 0,
      "borderWidthPx": 1
    },
    "effects": {
      "pageBackgroundImage": "linear-gradient(124deg, transparent 78%, #323537 78% 79%, transparent 79%)",
      "surfaceBackgroundImage": "none",
      "shadow": "none"
    }
  },
  {
    "id": "quarry",
    "name": "Quarry",
    "group": "strong",
    "appearance": "light",
    "status": "exploration",
    "concept": {
      "premise": "Raw / architectural",
      "materials": "Raw concrete \u00b7 fractured edges \u00b7 survey blue",
      "geometry": "Fracture cuts, concrete slabs and cobalt survey marks.",
      "completion": "A solid mark records completion.",
      "composition": "Monumental headline, work list and a weekly progress panel."
    },
    "fonts": {
      "display": "archivo-black",
      "body": "dm-sans",
      "mono": "ibm-plex-mono"
    },
    "display": {
      "weight": 400,
      "letterSpacingEm": -0.045,
      "lineHeight": 0.96,
      "textTransform": "uppercase"
    },
    "palette": {
      "page": "#D8D3C7",
      "surface": "#292D29",
      "ink": "#282A24",
      "surfaceInk": "#E9E3D4",
      "muted": "#585B50",
      "primary": "#943C2E",
      "onPrimary": "#FFF0D9",
      "secondary": "#244FC3",
      "onSecondary": "#F0F1FF",
      "border": "#97998A",
      "display": "#282A24"
    },
    "geometry": {
      "radiusPx": 0,
      "borderWidthPx": 1
    },
    "effects": {
      "pageBackgroundImage": "repeating-linear-gradient(173deg, transparent 0 19px, #292a2405 19px 20px)",
      "surfaceBackgroundImage": "none",
      "shadow": "5px 5px 0 #918b80"
    }
  },
  {
    "id": "fieldwork",
    "name": "Fieldwork",
    "group": "strong",
    "appearance": "dark",
    "status": "exploration",
    "concept": {
      "premise": "Rugged / purposeful",
      "materials": "Woven canvas \u00b7 stitched labels \u00b7 brass hardware",
      "geometry": "Stitched rectangular patches and woven canvas.",
      "completion": "A solid mark records completion.",
      "composition": "Monumental headline, work list and a weekly progress panel."
    },
    "fonts": {
      "display": "oswald",
      "body": "dm-sans",
      "mono": "ibm-plex-mono"
    },
    "display": {
      "weight": 700,
      "letterSpacingEm": -0.045,
      "lineHeight": 0.96,
      "textTransform": "uppercase"
    },
    "palette": {
      "page": "#252E23",
      "surface": "#354432",
      "ink": "#EAE2CC",
      "surfaceInk": "#E7DFC9",
      "muted": "#BDC4AA",
      "primary": "#D8B96C",
      "onPrimary": "#332B18",
      "secondary": "#A2BDC9",
      "onSecondary": "#243A42",
      "border": "#7F8B72",
      "display": "#EAE2CC"
    },
    "geometry": {
      "radiusPx": 3,
      "borderWidthPx": 1
    },
    "effects": {
      "pageBackgroundImage": "repeating-linear-gradient(90deg, #e5dcc609 0 1px, transparent 1px 4px)",
      "surfaceBackgroundImage": "none",
      "shadow": "none"
    }
  }
] as const satisfies readonly BrandThemeDefinition[];
