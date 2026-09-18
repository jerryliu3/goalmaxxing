import type { BrandThemeDefinition } from "./types";

export const WORLDS_THEMES = [
  {
    "id": "undertow",
    "name": "Undertow",
    "group": "worlds",
    "appearance": "dark",
    "status": "shortlisted",
    "concept": {
      "premise": "Bioluminescent expedition",
      "materials": "Pressure glass \u00b7 depth rings \u00b7 luminous points",
      "geometry": "Circular instruments and depth graduations.",
      "completion": "A navigation light switches on",
      "composition": "Expressive day heading, week strip and tactile progress panel."
    },
    "fonts": {
      "display": "space-grotesk",
      "body": "dm-sans",
      "mono": "ibm-plex-mono"
    },
    "display": {
      "weight": 400,
      "letterSpacingEm": -0.035,
      "lineHeight": 1.05
    },
    "palette": {
      "page": "#071C27",
      "surface": "#16364A",
      "ink": "#E0F6EF",
      "surfaceInk": "#E0F6EF",
      "muted": "#AEC6CF",
      "primary": "#72EBC4",
      "onPrimary": "#073A32",
      "secondary": "#B4A6EE",
      "onSecondary": "#292146",
      "border": "#496673",
      "display": "#E0F6EF"
    },
    "geometry": {
      "radiusPx": 14,
      "borderWidthPx": 1
    },
    "effects": {
      "pageBackgroundImage": "radial-gradient(ellipse at 90% 20%, #103b524f, transparent 55%)",
      "surfaceBackgroundImage": "none",
      "shadow": "none"
    }
  },
  {
    "id": "kiln",
    "name": "Kiln",
    "group": "worlds",
    "appearance": "dark",
    "status": "shortlisted",
    "concept": {
      "premise": "Fired earth & cobalt glaze",
      "materials": "Unglazed clay \u00b7 cobalt enamel \u00b7 arch cuts",
      "geometry": "Clay arches and cobalt-glazed inset panels.",
      "completion": "A soft clay mark takes a glaze",
      "composition": "Expressive day heading, week strip and tactile progress panel."
    },
    "fonts": {
      "display": "instrument-serif",
      "body": "dm-sans",
      "mono": "ibm-plex-mono"
    },
    "display": {
      "weight": 400,
      "letterSpacingEm": -0.035,
      "lineHeight": 1.05
    },
    "palette": {
      "page": "#38201F",
      "surface": "#F2DFBE",
      "ink": "#F7E5D0",
      "surfaceInk": "#4B2924",
      "muted": "#DCBAA7",
      "primary": "#F49D68",
      "onPrimary": "#482019",
      "secondary": "#A8C1F5",
      "onSecondary": "#20395D",
      "border": "#916559",
      "display": "#F7E5D0"
    },
    "geometry": {
      "radiusPx": 4,
      "borderWidthPx": 1
    },
    "effects": {
      "pageBackgroundImage": "radial-gradient(ellipse at 100% 0%, #8e43273b, transparent 60%)",
      "surfaceBackgroundImage": "none",
      "shadow": "none"
    }
  },
  {
    "id": "court",
    "name": "Centre Court",
    "group": "worlds",
    "appearance": "light",
    "status": "shortlisted",
    "concept": {
      "premise": "The everyday sporting club",
      "materials": "Painted court \u00b7 chalk lines \u00b7 felt ball",
      "geometry": "Square scorecards, chalk rules and court markings.",
      "completion": "A square on the scorecard fills",
      "composition": "Expressive day heading, week strip and tactile progress panel."
    },
    "fonts": {
      "display": "antonio",
      "body": "dm-sans",
      "mono": "ibm-plex-mono"
    },
    "display": {
      "weight": 400,
      "letterSpacingEm": -0.035,
      "lineHeight": 1.05
    },
    "palette": {
      "page": "#F0F0D9",
      "surface": "#174E3C",
      "ink": "#183F31",
      "surfaceInk": "#F4F2DC",
      "muted": "#50644A",
      "primary": "#174E3C",
      "onPrimary": "#F4F2DC",
      "secondary": "#DCED65",
      "onSecondary": "#244224",
      "border": "#A7B496",
      "display": "#183F31"
    },
    "geometry": {
      "radiusPx": 1,
      "borderWidthPx": 1
    },
    "effects": {
      "pageBackgroundImage": "none",
      "surfaceBackgroundImage": "none",
      "shadow": "none"
    }
  },
  {
    "id": "longplay",
    "name": "Longplay",
    "group": "worlds",
    "appearance": "dark",
    "status": "exploration",
    "concept": {
      "premise": "A warm listening room",
      "materials": "Cherry lacquer \u00b7 sleeve paper \u00b7 amber dials",
      "geometry": "Record grooves and flat paper sleeves.",
      "completion": "An amber indicator warms up",
      "composition": "Expressive day heading, week strip and tactile progress panel."
    },
    "fonts": {
      "display": "bodoni-moda",
      "body": "dm-sans",
      "mono": "ibm-plex-mono"
    },
    "display": {
      "weight": 400,
      "letterSpacingEm": -0.035,
      "lineHeight": 1.05
    },
    "palette": {
      "page": "#2C171D",
      "surface": "#F0D5BC",
      "ink": "#F7E3CE",
      "surfaceInk": "#4A232C",
      "muted": "#D8B6AB",
      "primary": "#EFBB71",
      "onPrimary": "#40241B",
      "secondary": "#D77E87",
      "onSecondary": "#38151E",
      "border": "#8C686B",
      "display": "#F7E3CE"
    },
    "geometry": {
      "radiusPx": 3,
      "borderWidthPx": 1
    },
    "effects": {
      "pageBackgroundImage": "linear-gradient(120deg, #35161e, #271519 65%)",
      "surfaceBackgroundImage": "none",
      "shadow": "none"
    }
  },
  {
    "id": "lido",
    "name": "Lido",
    "group": "worlds",
    "appearance": "light",
    "status": "exploration",
    "concept": {
      "premise": "An endless-summer pool club",
      "materials": "Glazed tile \u00b7 canvas stripes \u00b7 enamel signs",
      "geometry": "Pool tiles, canvas stripes and enamel signage.",
      "completion": "A cobalt tile drops into place",
      "composition": "Expressive day heading, week strip and tactile progress panel."
    },
    "fonts": {
      "display": "dela-gothic-one",
      "body": "dm-sans",
      "mono": "ibm-plex-mono"
    },
    "display": {
      "weight": 400,
      "letterSpacingEm": -0.035,
      "lineHeight": 1.05
    },
    "palette": {
      "page": "#E8F2EC",
      "surface": "#85CEC1",
      "ink": "#153E6E",
      "surfaceInk": "#163E48",
      "muted": "#456A78",
      "primary": "#134FC7",
      "onPrimary": "#FFFBE8",
      "secondary": "#F28C68",
      "onSecondary": "#4E251B",
      "border": "#849FA5",
      "display": "#153E6E"
    },
    "geometry": {
      "radiusPx": 2,
      "borderWidthPx": 1
    },
    "effects": {
      "pageBackgroundImage": "none",
      "surfaceBackgroundImage": "none",
      "shadow": "none"
    }
  },
  {
    "id": "opaline",
    "name": "Opaline",
    "group": "worlds",
    "appearance": "light",
    "status": "shortlisted",
    "concept": {
      "premise": "Light held in colored glass",
      "materials": "Milk glass \u00b7 refracted edges \u00b7 polished lenses",
      "geometry": "Polished lenses and refracted translucent edges.",
      "completion": "A pearl settles into its lens",
      "composition": "Expressive day heading, week strip and tactile progress panel."
    },
    "fonts": {
      "display": "instrument-serif",
      "body": "dm-sans",
      "mono": "ibm-plex-mono"
    },
    "display": {
      "weight": 400,
      "letterSpacingEm": -0.035,
      "lineHeight": 1.05
    },
    "palette": {
      "page": "#E8E3F2",
      "surface": "#CCC8E9",
      "ink": "#4F2A60",
      "surfaceInk": "#462455",
      "muted": "#735F83",
      "primary": "#663166",
      "onPrimary": "#FFF2F6",
      "secondary": "#86D6CE",
      "onSecondary": "#164E4A",
      "border": "#B7ACCB",
      "display": "#4F2A60"
    },
    "geometry": {
      "radiusPx": 20,
      "borderWidthPx": 1
    },
    "effects": {
      "pageBackgroundImage": "linear-gradient(125deg, #e8e3f2, #f3ecee 60%, #d9eee7)",
      "surfaceBackgroundImage": "none",
      "shadow": "none"
    }
  }
] as const satisfies readonly BrandThemeDefinition[];
