export type BrandRound = "one" | "mix" | "final" | "kit" | "atmosphere" | "study";

export type BrandSlug =
  | "forge"
  | "contour"
  | "folio"
  | "dawn"
  | "waypath"
  | "field-notes"
  | "alpenglow"
  | "switchback"
  | "gazetteer"
  | "vellum"
  | "lookout"
  | "meridian"
  | "col"
  | "gazetteer-sans"
  | "col-sans"
  | "kit-gazetteer"
  | "kit-col"
  | "glassline"
  | "harbor"
  | "ion"
  | "neon-pass"
  | "atelier"
  | "summit-night"
  | "riverstone"
  | "helios"
  | "aero"
  | "hue-contrast"
  | "second-hue";

export interface BrandCardStyle {
  bg: string;
  fg: string;
  accent: string;
  type: string;
}

export interface BrandDirection {
  slug: BrandSlug;
  href: `/ux/brand/${BrandSlug}`;
  letter: string;
  name: string;
  epithet: string;
  feeling: string;
  refs: string;
  fonts: string;
  palette: string;
  motif: string;
  round: BrandRound;
  mix?: string;
  screenshot?: boolean;
  card: BrandCardStyle;
}

export const BRAND_ROUND_ONE: readonly BrandDirection[] = [
  {
    slug: "forge",
    href: "/ux/brand/forge",
    letter: "1",
    name: "Forge",
    epithet: "Elite performance",
    feeling: "Grit, mastery, a high-stakes climb.",
    refs: "Peloton, Nike SNKRS, Whoop, MasterClass — plus the Kumar reel as the only reference for this direction.",
    fonts: "Playfair Display SC for the behind-type, Playfair Display for titles, DM Sans for chrome.",
    palette: "Near-black charcoal, warm ivory type, one electric red.",
    motif: "Giant serif word sitting behind the day’s work. Completion is a red slash, not a green checkbox.",
    round: "one",
    screenshot: true,
    card: {
      bg: "#070708",
      fg: "#f6f1ea",
      accent: "#e31c25",
      type: "ui-serif, Georgia, serif",
    },
  },
  {
    slug: "contour",
    href: "/ux/brand/contour",
    letter: "2",
    name: "Contour",
    epithet: "Field guide",
    feeling: "You are on a trail. Elevation is progress.",
    refs: "AllTrails, Komoot, Relive, Strava’s route polyline — steal the map-as-proof, not the orange brand.",
    fonts: "IBM Plex Sans for UI, IBM Plex Mono for gain/distance.",
    palette: "Topo-map paper, forest green, amber for strain, brick for a miss.",
    motif: "Contour lines as the canvas. The week is an elevation profile. A row is a trail card.",
    round: "one",
    card: {
      bg: "#f2f4f1",
      fg: "#1a1c18",
      accent: "#3d6b2f",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
  {
    slug: "folio",
    href: "/ux/brand/folio",
    letter: "3",
    name: "Folio",
    epithet: "Journey journal",
    feeling: "Your year is a book. Today is a chapter you are still writing.",
    refs: "Polarsteps travel books, Letterboxd’s serif/grotesk split, Day One, StoryGraph.",
    fonts: "Newsreader for display and entries, Source Sans 3 for labels.",
    palette: "Warm cream paper, walnut ink, terracotta stamp, gold leaf rule.",
    motif: "Running heads, chapter numerals, stamped dates, hairline ledger rules.",
    round: "one",
    card: {
      bg: "#efe6d6",
      fg: "#241c14",
      accent: "#b5522a",
      type: "ui-serif, Georgia, serif",
    },
  },
  {
    slug: "dawn",
    href: "/ux/brand/dawn",
    letter: "4",
    name: "Dawn Ridge",
    epithet: "Landing energy, in the app",
    feeling: "Air, horizon, climbing toward something you can already see.",
    refs: "Goalmaxxing landing mountain chapter, Flighty’s packed numbers, Copilot’s monumental type, Apple Fitness glance.",
    fonts: "Instrument Sans at display scale. No serif. Numbers do the drama.",
    palette: "Parchment sky, cool ridge blue, peach sun, landing blue for action.",
    motif: "Sky and ridges as structure. One huge remaining count. Chrome recedes.",
    round: "one",
    card: {
      bg: "#e7eef2",
      fg: "#243038",
      accent: "#1d4ed8",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
  {
    slug: "waypath",
    href: "/ux/brand/waypath",
    letter: "5",
    name: "Waypath",
    epithet: "Cairn trail",
    feeling: "Embarking. The next stone is visible. The summit is implied.",
    refs: "Monument Valley, Alto’s Odyssey, Polarsteps route dots — not Duolingo’s cartoon path.",
    fonts: "Syne for display, Outfit for UI.",
    palette: "Sandstone, terracotta, dusk mauve, sage lichen.",
    motif: "The week is a winding cairn path. Today is the stone you are standing on.",
    round: "one",
    card: {
      bg: "#f3ebe3",
      fg: "#3a2a24",
      accent: "#c46a48",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
] as const;

export const BRAND_MIXES: readonly BrandDirection[] = [
  {
    slug: "field-notes",
    href: "/ux/brand/field-notes",
    letter: "6",
    name: "Field Notes",
    epithet: "Journal of a trail",
    feeling: "You are keeping a log on the ridge, not browsing a dashboard.",
    refs: "Folio’s apparatus + Contour’s gain. Polarsteps book meets AllTrails stats.",
    fonts: "Newsreader titles, IBM Plex Sans UI, IBM Plex Mono metres.",
    palette: "Sage paper, walnut ink, forest pulled back to a margin green.",
    motif: "Numbered entries with a gain column. Completion stacks a second ink tick.",
    round: "mix",
    mix: "Folio × Contour",
    card: {
      bg: "#eef1e8",
      fg: "#1f241c",
      accent: "#4a6740",
      type: "ui-serif, Georgia, serif",
    },
  },
  {
    slug: "alpenglow",
    href: "/ux/brand/alpenglow",
    letter: "7",
    name: "Alpenglow",
    epithet: "Literary dawn",
    feeling: "The light on the mountain just before the work starts.",
    refs: "Dawn Ridge sky + Folio Newsreader. Landing peach sun, journal Thursday.",
    fonts: "Newsreader display, Instrument Sans labels.",
    palette: "Peach sun, parchment sky, cool ridge, walnut titles.",
    motif: "Serif Thursday on a dawn sky. Completion stacks a peach stone on a blue one.",
    round: "mix",
    mix: "Folio × Dawn Ridge",
    card: {
      bg: "#f4ece3",
      fg: "#2a2420",
      accent: "#c47a5a",
      type: "ui-serif, Georgia, serif",
    },
  },
  {
    slug: "switchback",
    href: "/ux/brand/switchback",
    letter: "8",
    name: "Switchback",
    epithet: "Elevation in air",
    feeling: "The week is a ridge line. Today is the hairpin you are on.",
    refs: "Contour’s profile + Dawn Ridge color. No forest green, no serif.",
    fonts: "Instrument Sans, IBM Plex Mono for gain.",
    palette: "Sky #E7EEF2, slate trail, peach miss, landing blue marker.",
    motif: "Elevation profile in dawn colors. Completion adds a second peak on the row sparkline.",
    round: "mix",
    mix: "Contour × Dawn Ridge",
    card: {
      bg: "#e8eef3",
      fg: "#243038",
      accent: "#3b6ea8",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
  {
    slug: "gazetteer",
    href: "/ux/brand/gazetteer",
    letter: "9",
    name: "Gazetteer",
    epithet: "Surveyor’s ledger",
    feeling: "A place-name book. Every session has a number, a name, and a rise.",
    refs: "Folio ledger rules + Contour legend stats. Day One density, AllTrails table.",
    fonts: "Newsreader names, Source Sans 3 labels, IBM Plex Mono rise.",
    palette: "Warm cream, walnut, stamp rust, rule gold — Contour green only in the gutter.",
    motif: "Three-column page: index, title, +m. Completion nests an inner square. Blaze stack is the runner-up.",
    round: "mix",
    mix: "Folio × Contour",
    card: {
      bg: "#f3ead8",
      fg: "#241c14",
      accent: "#9a4f2c",
      type: "ui-serif, Georgia, serif",
    },
  },
  {
    slug: "vellum",
    href: "/ux/brand/vellum",
    letter: "10",
    name: "Vellum",
    epithet: "Map printed in a book",
    feeling: "A topographic plate bound into a journal.",
    refs: "Folio paper + Contour ellipses as a printed plate + Dawn’s sun disc.",
    fonts: "Newsreader, Source Sans 3.",
    palette: "Vellum cream, faint sage contours, peach sun, walnut ink.",
    motif: "Contour lines as a book plate. Completion stacks two vellum chips.",
    round: "mix",
    mix: "Folio × Contour × Dawn Ridge",
    card: {
      bg: "#f6f0e4",
      fg: "#2c261e",
      accent: "#8a6a3a",
      type: "ui-serif, Georgia, serif",
    },
  },
  {
    slug: "lookout",
    href: "/ux/brand/lookout",
    letter: "11",
    name: "Lookout",
    epithet: "Glance from the ridge",
    feeling: "You already see how much climb is left.",
    refs: "Dawn’s architectural 3 + Contour’s you-are-here + Folio italic caption.",
    fonts: "Instrument Sans. Folio italic only on the caption.",
    palette: "Open sky, ridge blue-gray, peach sun, walnut caption.",
    motif: "Huge remaining count over a ridge with a marker. Completion stacks a second disc, offset, not a fill.",
    round: "mix",
    mix: "Dawn Ridge × Contour",
    card: {
      bg: "#e6eef4",
      fg: "#243038",
      accent: "#1d4ed8",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
  {
    slug: "meridian",
    href: "/ux/brand/meridian",
    letter: "12",
    name: "Meridian",
    epithet: "The profile is the object",
    feeling: "Progress is a line of longitude you can read at a glance.",
    refs: "Dawn’s number + Contour’s elevation as the hero, Flighty packing.",
    fonts: "Instrument Sans, IBM Plex Mono on the axis.",
    palette: "Cool meridian blue-gray, parchment plot, one peach today-mark.",
    motif: "The elevation plot is Home. Completion stacks a second segment onto a rise bar.",
    round: "mix",
    mix: "Contour × Dawn Ridge",
    card: {
      bg: "#e4eaee",
      fg: "#1e2a32",
      accent: "#4d6d82",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
  {
    slug: "col",
    href: "/ux/brand/col",
    letter: "13",
    name: "Col",
    epithet: "The pass between two peaks",
    feeling: "A chapter written at the saddle, with the next ridge in view.",
    refs: "Folio chapter + Dawn ridges as furniture + Contour gain.",
    fonts: "Newsreader chapter, Instrument Sans chrome.",
    palette: "Parchment sky, ridge taupe, stamp rust, lichen on the cairn only.",
    motif: "Running head Col 36. Ridges under a serif page. Completion stacks two stones.",
    round: "mix",
    mix: "Folio × Dawn Ridge × Contour",
    card: {
      bg: "#efe8dc",
      fg: "#2a241c",
      accent: "#b5522a",
      type: "ui-serif, Georgia, serif",
    },
  },
] as const;

export const BRAND_FINALISTS: readonly BrandDirection[] = [
  {
    slug: "gazetteer-sans",
    href: "/ux/brand/gazetteer-sans",
    letter: "14",
    name: "Gazetteer Sans",
    epithet: "Ledger, modern type",
    feeling: "The same surveyor’s book, set in a newspaper grotesque instead of a literary serif.",
    refs: "Gazetteer’s cream ledger and stamp rust. Schibsted Grotesk in place of Newsreader.",
    fonts: "Schibsted Grotesk for names and labels, IBM Plex Mono for rise.",
    palette: "Cream #F3EAD8 · walnut · stamp rust #9A4F2C — Contour green only in the gutter.",
    motif: "Three-column page. Completing nests an inner object in an outer vessel — switch the mark on the page.",
    round: "final",
    mix: "Gazetteer × sans",
    card: {
      bg: "#f3ead8",
      fg: "#241c14",
      accent: "#9a4f2c",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
  {
    slug: "col-sans",
    href: "/ux/brand/col-sans",
    letter: "15",
    name: "Col Sans",
    epithet: "The pass, in air",
    feeling: "The same saddle and sky, with a soft modern grotesque instead of a chapter serif.",
    refs: "Col’s parchment sky and ridges. Figtree in place of Newsreader.",
    fonts: "Figtree for chapter and chrome, IBM Plex Mono for gain.",
    palette: "Parchment sky, ridge taupe, stamp rust, lichen on the done mark.",
    motif: "Running head Col 36. Completing is inner-into-outer, not a second stone on a pile.",
    round: "final",
    mix: "Col × sans",
    card: {
      bg: "#efe8dc",
      fg: "#2a241c",
      accent: "#b5522a",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
] as const;

export const BRAND_STUDIES: readonly BrandDirection[] = [
  {
    slug: "hue-contrast",
    href: "/ux/brand/hue-contrast",
    letter: "S1",
    name: "Hue contrast",
    epithet: "Second color study",
    feeling:
      "Same Thursday list. Toggle a second hue for today and the selected row. Identity color stays put.",
    refs: "Harbor, Summit Night, Atelier copper, Riverstone water — as selection colors, not new worlds.",
    fonts: "Gazetteer: Newsreader + Source Sans 3. Live: Inter.",
    palette:
      "Gazetteer rust identity. Live blue identity. Toggles: Prussian, copper, ice / brass, peach, seafoam.",
    motif:
      "Week today-mark and one selected row use the second hue. Nest fill stays the identity color.",
    round: "study",
    card: {
      bg: "#f8f1e3",
      fg: "#241c14",
      accent: "#2c6470",
      type: "ui-serif, Georgia, serif",
    },
  },
  {
    slug: "second-hue",
    href: "/ux/brand/second-hue",
    letter: "S2",
    name: "Second hue",
    epithet: "Which jobs take the second color",
    feeling:
      "Assign act, place, pick, today, done, and focus to identity, second hue, or ink, and read it on production components in every theme.",
    refs: "PR #1161 selection treatment, the theme identity study, the brand color library.",
    fonts: "Each registered theme's own faces.",
    palette:
      "Registry selection pairs, plus solid and tint candidates for Original and Gazetteer.",
    motif:
      "Mixes: One hue, Selection, Containers, Where and when, Reward. Contrast readouts per theme.",
    round: "study",
    card: {
      bg: "#fafafb",
      fg: "#1f1f24",
      accent: "#246b78",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
] as const;

export const BRAND_KITS: readonly BrandDirection[] = [
  {
    slug: "kit-gazetteer",
    href: "/ux/brand/kit-gazetteer",
    letter: "K1",
    name: "Gazetteer kit",
    epithet: "Applied Spatial Plan atoms",
    feeling: "The leading vibe on pills, rows, week, month, heatmap, and a sheet.",
    refs: "Gazetteer lock. Nest completion. Soft paper corners; Square and Pills as a comparison toggle.",
    fonts: "Newsreader names, Source Sans 3 labels, IBM Plex Mono rise.",
    palette: "Cream, walnut, stamp rust, gutter green only on metres.",
    motif: "Ledger hairlines on Plan week and a nested-square heatmap.",
    round: "kit",
    mix: "Applied kit",
    card: {
      bg: "#f3ead8",
      fg: "#241c14",
      accent: "#9a4f2c",
      type: "ui-serif, Georgia, serif",
    },
  },
  {
    slug: "kit-col",
    href: "/ux/brand/kit-col",
    letter: "K2",
    name: "Col kit",
    epithet: "Figtree on the pass",
    feeling: "Col’s sky and ridges, with Figtree, so the two kits can be compared.",
    refs: "Col runner-up. Figtree only — not the Col Sans page restyle. Nest + cairn. Soft paper corners.",
    fonts: "Figtree chapter and chrome, IBM Plex Mono gain.",
    palette: "Parchment sky, ridge taupe, stamp rust, lichen on the done mark.",
    motif: "Week agenda over ridges. Nested-square heatmap in lichen.",
    round: "kit",
    mix: "Applied kit",
    card: {
      bg: "#efe8dc",
      fg: "#2a241c",
      accent: "#b5522a",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
] as const;

export const BRAND_ATMOSPHERES: readonly BrandDirection[] = [
  {
    slug: "glassline",
    href: "/ux/brand/glassline",
    letter: "A1",
    name: "Glassline",
    epithet: "Swiss quiet",
    feeling: "Ambition as open space: exact, calm, and almost weightless.",
    refs: "Swiss posters, Braun, Linear — a complete minimal system, not generic SaaS.",
    fonts: "Inter at one optical voice; scale and spacing create hierarchy.",
    palette: "Paper white, black ink, cool-gray rules. Deliberately no accent color.",
    motif: "Baseline grid and registration marks. Completion snaps a square into alignment.",
    round: "atmosphere",
    card: {
      bg: "#f4f4f1",
      fg: "#111111",
      accent: "#111111",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
  {
    slug: "harbor",
    href: "/ux/brand/harbor",
    letter: "A2",
    name: "Harbor",
    epithet: "Open water",
    feeling: "Freedom is casting off: horizon ahead, safe water behind.",
    refs: "Coastal charts, ocean passages, Flighty status density — no mountain furniture.",
    fonts: "Fraunces italic for the horizon voice, Outfit for navigation and manifests.",
    palette: "Deep harbor navy, seafoam, foam white, one brass fitting.",
    motif: "Tide line, pier-post week, manifest rows. Completion raises a buoy.",
    round: "atmosphere",
    card: {
      bg: "#0d3344",
      fg: "#eaf6f3",
      accent: "#7ec8c3",
      type: "ui-serif, Georgia, serif",
    },
  },
  {
    slug: "ion",
    href: "/ux/brand/ion",
    letter: "A3",
    name: "Ion",
    epithet: "Mission white",
    feeling: "The work is telemetry; ascent is charge, precision, and forward thrust.",
    refs: "NASA mission boards, Nothing, Teenage Engineering — bright future, not dark sci-fi.",
    fonts: "Space Grotesk for commands, IBM Plex Mono for clocks and telemetry.",
    palette: "Lab white, graphite, blueprint grid, one electric blue.",
    motif: "Instrument modules and T-minus status. Completion closes an orbital ring.",
    round: "atmosphere",
    card: {
      bg: "#f3f6fb",
      fg: "#12151c",
      accent: "#0b6fff",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
  {
    slug: "neon-pass",
    href: "/ux/brand/neon-pass",
    letter: "A4",
    name: "Neon Pass",
    epithet: "Night-city climb",
    feeling: "Adventure after dark: a luminous route cut through the city.",
    refs: "Arcade cabinets, cyberpunk HUDs, terminal glass — not Forge's red serif theatre.",
    fonts: "Rajdhani for angular display, IBM Plex Mono for route commands.",
    palette: "Violet-black, ultraviolet magenta, electric cyan, soft phosphor white.",
    motif: "Chamfered glass and scan lines. Completion ignites a diamond waypoint.",
    round: "atmosphere",
    card: {
      bg: "#100716",
      fg: "#f5eaff",
      accent: "#ff2bd6",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
  {
    slug: "atelier",
    href: "/ux/brand/atelier",
    letter: "A5",
    name: "Atelier",
    epithet: "Workshop ticket",
    feeling: "Old-school craft: today is a job placed carefully on the bench.",
    refs: "Letterpress tickets, artist studios, Japanese workwear — not Folio's newspaper page.",
    fonts: "Cormorant Garamond for the maker's voice, Karla for work orders.",
    palette: "Plaster, raw ochre, oxidized copper, vermilion wax, charcoal.",
    motif: "Perforated work orders and maker's marks. Completion presses a wax seal.",
    round: "atmosphere",
    card: {
      bg: "#e4d5b8",
      fg: "#2a2218",
      accent: "#b73d25",
      type: "ui-serif, Georgia, serif",
    },
  },
  {
    slug: "summit-night",
    href: "/ux/brand/summit-night",
    letter: "A6",
    name: "Summit Night",
    epithet: "Alpine dark",
    feeling: "The climb continues after sunset; the summit is a distant lantern.",
    refs: "Night alpinism, ski huts, star charts — neither Forge nor Dawn Ridge.",
    fonts: "Sora for clear cold-air UI, IBM Plex Mono for elevation.",
    palette: "Indigo night, snow, ice cyan, one lantern amber.",
    motif: "Star field, ridge silhouette, rope-team list. Completion lights a lantern.",
    round: "atmosphere",
    card: {
      bg: "#0c1220",
      fg: "#e8eef8",
      accent: "#f0b45a",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
  {
    slug: "riverstone",
    href: "/ux/brand/riverstone",
    letter: "A7",
    name: "Riverstone",
    epithet: "Wet stone",
    feeling: "Progress is patient water: a stone settles, the current keeps moving.",
    refs: "River gardens, mist photography, worn pebbles — no topo map and no cartoon path.",
    fonts: "Source Serif 4 for names, Nunito Sans for quiet controls.",
    palette: "River mist, wet slate, lichen, pale mineral stone.",
    motif: "Organic stone cards and ripples. Completion settles a pebble into water.",
    round: "atmosphere",
    card: {
      bg: "#d5e0db",
      fg: "#24302e",
      accent: "#4f7d74",
      type: "ui-serif, Georgia, serif",
    },
  },
  {
    slug: "helios",
    href: "/ux/brand/helios",
    letter: "A8",
    name: "Helios",
    epithet: "Toward the light",
    feeling: "The journey is solar: warm, optimistic, and pulled toward the horizon.",
    refs: "Mediterranean travel posters, golden-hour film, monumental editorial type.",
    fonts: "DM Serif Display for the day, DM Sans for sun-clean chrome.",
    palette: "Warm white, solar gold, earth terracotta, a trace of noon blue.",
    motif: "Radial sun and long shadows. Completion opens a corona.",
    round: "atmosphere",
    card: {
      bg: "#fff1d6",
      fg: "#3b1d0a",
      accent: "#d97706",
      type: "ui-serif, Georgia, serif",
    },
  },
  {
    slug: "aero",
    href: "/ux/brand/aero",
    letter: "A9",
    name: "Aero",
    epithet: "Altitude",
    feeling: "Freedom as lift: the climb becomes altitude you can feel and read.",
    refs: "Aviation instruments, Flighty, Braun calculators — technical without becoming Ion.",
    fonts: "Barlow Condensed for altitude, Barlow for controls and labels.",
    palette: "Brushed aluminum, flight navy, cloud white, aviation orange.",
    motif: "Altimeter tape and contrail week. Completion locks an orange chevron.",
    round: "atmosphere",
    card: {
      bg: "#d9e1ea",
      fg: "#152033",
      accent: "#f05a22",
      type: "ui-sans-serif, system-ui, sans-serif",
    },
  },
] as const;

export const BRAND_DIRECTIONS: readonly BrandDirection[] = [
  ...BRAND_STUDIES,
  ...BRAND_ATMOSPHERES,
  ...BRAND_KITS,
  ...BRAND_FINALISTS,
  ...BRAND_ROUND_ONE,
  ...BRAND_MIXES,
];

export const BRAND_TODAY_ROWS = [
  {
    id: "tempo-run",
    title: "Tempo run",
    meta: "Health · 3× this week",
    state: "open" as const,
    effort: "+240 m",
  },
  {
    id: "launch-notes",
    title: "Launch notes",
    meta: "Career · one-time",
    state: "open" as const,
    effort: "+80 m",
  },
  {
    id: "weekly-reset",
    title: "Weekly reset",
    meta: "Career · weekly",
    state: "open" as const,
    effort: "+40 m",
  },
  {
    id: "deep-work",
    title: "Deep work",
    meta: "Career · daily",
    state: "done" as const,
    effort: "+120 m",
  },
] as const;

export const BRAND_WEEK = [
  { label: "S", date: 30, done: 2, kind: "past" as const },
  { label: "M", date: 31, done: 1, kind: "past" as const },
  { label: "T", date: 1, done: 0, kind: "miss" as const },
  { label: "W", date: 2, done: 3, kind: "past" as const },
  { label: "T", date: 3, done: 1, kind: "today" as const },
  { label: "F", date: 4, done: 0, kind: "ahead" as const },
  { label: "S", date: 5, done: 0, kind: "ahead" as const },
] as const;

export const BRAND_WEEK_DONE = 7;
export const BRAND_WEEK_PLANNED = 10;
export const BRAND_TODAY_LEFT = 3;

export const ELEVATION_PROFILE = [18, 28, 12, 42, 58, 64, 88] as const;
