/**
 * Concept notes and study-authored styling for every /ux/brand skin, kept
 * from the brand library (#964) for adapting a skin. Themes carry only what
 * they render; these notes sit beside them, keyed by skin id.
 */
export interface StudySkinNotes {
  status: "shortlisted" | "exploration" | "archived";
  concept: {
    premise: string;
    materials: string;
    geometry: string;
    completion: string;
    composition: string;
  };
  display: {
    weight: number;
    letterSpacingEm: number;
    lineHeight: number;
    textTransform?: "uppercase";
    style?: "italic";
    color: string;
  };
  borderWidthPx: number;
  surfaceBackgroundImage: string;
  shadow: string;
}

export const STUDY_SKIN_NOTES: Readonly<Record<string, StudySkinNotes>> = {
  bloodstone: {
    status: "shortlisted",
    concept: {
      premise: "Monumental / cinematic",
      materials: "Dark mineral · red lacquer · steel inlay",
      geometry: "Monumental serif, mineral facets and steel inlays.",
      completion: "A solid mark records completion.",
      composition: "Monumental headline, work list and a weekly progress panel.",
    },
    display: { weight: 900, letterSpacingEm: -0.045, lineHeight: 0.96, textTransform: "uppercase", color: "#cc5157" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  pitlane: {
    status: "shortlisted",
    concept: {
      premise: "Kinetic / engineered",
      materials: "Painted curb · timing strip · asphalt",
      geometry: "Timing strips, slanted panels and cobalt racing enamel.",
      completion: "A solid mark records completion.",
      composition: "Monumental headline, work list and a weekly progress panel.",
    },
    display: { weight: 800, letterSpacingEm: -0.045, lineHeight: 0.96, textTransform: "uppercase", color: "#f0ede1" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  quarry: {
    status: "exploration",
    concept: {
      premise: "Raw / architectural",
      materials: "Raw concrete · fractured edges · survey blue",
      geometry: "Fracture cuts, concrete slabs and cobalt survey marks.",
      completion: "A solid mark records completion.",
      composition: "Monumental headline, work list and a weekly progress panel.",
    },
    display: { weight: 400, letterSpacingEm: -0.045, lineHeight: 0.96, textTransform: "uppercase", color: "#282a24" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "5px 5px 0 #918b80",
  },
  fieldwork: {
    status: "exploration",
    concept: {
      premise: "Rugged / purposeful",
      materials: "Woven canvas · stitched labels · brass hardware",
      geometry: "Stitched rectangular patches and woven canvas.",
      completion: "A solid mark records completion.",
      composition: "Monumental headline, work list and a weekly progress panel.",
    },
    display: { weight: 700, letterSpacingEm: -0.045, lineHeight: 0.96, textTransform: "uppercase", color: "#eae2cc" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  undertow: {
    status: "shortlisted",
    concept: {
      premise: "Bioluminescent expedition",
      materials: "Pressure glass · depth rings · luminous points",
      geometry: "Circular instruments and depth graduations.",
      completion: "A navigation light switches on",
      composition: "Expressive day heading, week strip and tactile progress panel.",
    },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.05, color: "#e0f6ef" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  kiln: {
    status: "shortlisted",
    concept: {
      premise: "Fired earth & cobalt glaze",
      materials: "Unglazed clay · cobalt enamel · arch cuts",
      geometry: "Clay arches and cobalt-glazed inset panels.",
      completion: "A soft clay mark takes a glaze",
      composition: "Expressive day heading, week strip and tactile progress panel.",
    },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.05, color: "#f7e5d0" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  court: {
    status: "shortlisted",
    concept: {
      premise: "The everyday sporting club",
      materials: "Painted court · chalk lines · felt ball",
      geometry: "Square scorecards, chalk rules and court markings.",
      completion: "A square on the scorecard fills",
      composition: "Expressive day heading, week strip and tactile progress panel.",
    },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.05, color: "#183f31" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  longplay: {
    status: "exploration",
    concept: {
      premise: "A warm listening room",
      materials: "Cherry lacquer · sleeve paper · amber dials",
      geometry: "Record grooves and flat paper sleeves.",
      completion: "An amber indicator warms up",
      composition: "Expressive day heading, week strip and tactile progress panel.",
    },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.05, color: "#f7e3ce" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  lido: {
    status: "exploration",
    concept: {
      premise: "An endless-summer pool club",
      materials: "Glazed tile · canvas stripes · enamel signs",
      geometry: "Pool tiles, canvas stripes and enamel signage.",
      completion: "A cobalt tile drops into place",
      composition: "Expressive day heading, week strip and tactile progress panel.",
    },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.05, color: "#153e6e" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  opaline: {
    status: "shortlisted",
    concept: {
      premise: "Light held in colored glass",
      materials: "Milk glass · refracted edges · polished lenses",
      geometry: "Polished lenses and refracted translucent edges.",
      completion: "A pearl settles into its lens",
      composition: "Expressive day heading, week strip and tactile progress panel.",
    },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.05, color: "#4f2a60" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  "fig-porcelain": {
    status: "archived",
    concept: {
      premise: "Tactile · quietly unusual",
      materials: "Aubergine × celadon",
      geometry: "Soft paper panels; rounded date cells.",
      completion: "Filled selection mark.",
      composition: "Editorial day heading above a quiet work list.",
    },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.05, color: "#59364f" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  "tidal-orchard": {
    status: "archived",
    concept: {
      premise: "Fresh · expansive · warm",
      materials: "Petrol × apricot",
      geometry: "Soft paper panels; rounded date cells.",
      completion: "Filled selection mark.",
      composition: "Editorial day heading above a quiet work list.",
    },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.05, color: "#1d5861" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  "garnet-glacier": {
    status: "archived",
    concept: {
      premise: "Composed · romantic · crisp",
      materials: "Oxblood × icy blue",
      geometry: "Soft paper panels; rounded date cells.",
      completion: "Filled selection mark.",
      composition: "Editorial day heading above a quiet work list.",
    },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.05, color: "#772f43" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  "blue-hour": {
    status: "archived",
    concept: {
      premise: "Optimistic · confident · graphic",
      materials: "Ultramarine × butter",
      geometry: "Soft paper panels; rounded date cells.",
      completion: "Filled selection mark.",
      composition: "Editorial day heading above a quiet work list.",
    },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.05, color: "#3548a8" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  "night-garden": {
    status: "archived",
    concept: {
      premise: "Curious · electric · unexpected",
      materials: "Mulberry × chartreuse",
      geometry: "Soft paper panels; rounded date cells.",
      completion: "Filled selection mark.",
      composition: "Editorial day heading above a quiet work list.",
    },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.05, color: "#58345d" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
  "guava-club": {
    status: "archived",
    concept: {
      premise: "Generous · playful · botanical",
      materials: "Deep pine × guava",
      geometry: "Soft paper panels; rounded date cells.",
      completion: "Filled selection mark.",
      composition: "Editorial day heading above a quiet work list.",
    },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.05, color: "#285849" },
    borderWidthPx: 1,
    surfaceBackgroundImage: "none",
    shadow: "none",
  },
};
