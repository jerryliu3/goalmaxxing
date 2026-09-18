/** Authored digital colors, not Pantone specifications. Never derive category ink by opacity. */
export interface ColorSwatch {
  readonly name: string;
  readonly surface: string;
  readonly ink: string;
  readonly mist?: string;
  readonly pigment?: string;
  readonly shade?: string;
}

export const COLOR_LIBRARY = {
  "sulfur": {
    "name": "Sulfur",
    "mist": "#F4F6C2",
    "surface": "#E1EA83",
    "pigment": "#CBDC35",
    "shade": "#858F21",
    "ink": "#363D10"
  },
  "vermilion": {
    "name": "Vermilion",
    "mist": "#FFE3D4",
    "surface": "#FFA583",
    "pigment": "#ED582D",
    "shade": "#AE3920",
    "ink": "#632310"
  },
  "ultraviolet": {
    "name": "Ultraviolet",
    "mist": "#EEE5FF",
    "surface": "#C4A8F5",
    "pigment": "#8A4FE0",
    "shade": "#5D269D",
    "ink": "#351655"
  },
  "pool-cyan": {
    "name": "Pool cyan",
    "mist": "#D5F5F5",
    "surface": "#87DBE1",
    "pigment": "#19B9CD",
    "shade": "#14768B",
    "ink": "#123F50"
  },
  "black-cherry": {
    "name": "Black cherry",
    "mist": "#F9DCE8",
    "surface": "#DE93B6",
    "pigment": "#A72C64",
    "shade": "#701B42",
    "ink": "#3E132A"
  },
  "tangerine": {
    "name": "Tangerine",
    "mist": "#FFE9C6",
    "surface": "#FFC36D",
    "pigment": "#F69729",
    "shade": "#AE641A",
    "ink": "#5C340B"
  },
  "klein-blue": {
    "name": "Klein blue",
    "mist": "#E2E6FF",
    "surface": "#AABAFB",
    "pigment": "#3C5DDF",
    "shade": "#283FAB",
    "ink": "#18245F"
  },
  "malachite": {
    "name": "Malachite",
    "mist": "#D4F3DC",
    "surface": "#83D3A3",
    "pigment": "#219862",
    "shade": "#176744",
    "ink": "#103E2E"
  },
  "hot-lacquer": {
    "name": "Hot lacquer",
    "mist": "#FFE0EC",
    "surface": "#F88FBF",
    "pigment": "#E63287",
    "shade": "#A62060",
    "ink": "#571136"
  },
  "petroleum": {
    "name": "Petroleum",
    "mist": "#D8EEEE",
    "surface": "#88BBBF",
    "pigment": "#246B78",
    "shade": "#164956",
    "ink": "#0B2C38"
  },
  "saffron": {
    "name": "Saffron",
    "mist": "#FFF0B5",
    "surface": "#F4D35E",
    "pigment": "#DDB325",
    "shade": "#957215",
    "ink": "#4D3C0B"
  },
  "silver-lilac": {
    "name": "Silver lilac",
    "mist": "#F1EDF7",
    "surface": "#D1C9DF",
    "pigment": "#A39AB9",
    "shade": "#726486",
    "ink": "#3D334E"
  },
  "mineral-candy-pistachio": {
    "name": "Pistachio",
    "surface": "#C5D49A",
    "ink": "#394823"
  },
  "mineral-candy-cornflower": {
    "name": "Cornflower",
    "surface": "#ADBDE5",
    "ink": "#304674"
  },
  "mineral-candy-iris-milk": {
    "name": "Iris milk",
    "surface": "#C9B2D9",
    "ink": "#573A67"
  },
  "mineral-candy-guava": {
    "name": "Guava",
    "surface": "#ECA7A2",
    "ink": "#6D323A"
  },
  "mineral-candy-apricot": {
    "name": "Apricot",
    "surface": "#E9BD89",
    "ink": "#654220"
  },
  "sorbet-melon-rind": {
    "name": "Melon rind",
    "surface": "#DEE6B3",
    "ink": "#445329"
  },
  "sorbet-glacier": {
    "name": "Glacier",
    "surface": "#C9E2E7",
    "ink": "#2C535B"
  },
  "sorbet-lilac-cream": {
    "name": "Lilac cream",
    "surface": "#DDCCE9",
    "ink": "#5A436F"
  },
  "sorbet-rosewater": {
    "name": "Rosewater",
    "surface": "#F1C6CE",
    "ink": "#703E50"
  },
  "sorbet-buttercream": {
    "name": "Buttercream",
    "surface": "#F0DD9C",
    "ink": "#65501D"
  },
  "pigment-pickled-pear": {
    "name": "Pickled pear",
    "surface": "#ADB96B",
    "ink": "#303E19"
  },
  "pigment-blue-ceramic": {
    "name": "Blue ceramic",
    "surface": "#819FCA",
    "ink": "#1C3558"
  },
  "pigment-orchid-clay": {
    "name": "Orchid clay",
    "surface": "#B58CAF",
    "ink": "#46233F"
  },
  "pigment-persimmon": {
    "name": "Persimmon",
    "surface": "#E59773",
    "ink": "#5E2F1C"
  },
  "pigment-saffron": {
    "name": "Saffron",
    "surface": "#DAB567",
    "ink": "#5B4012"
  }
} as const satisfies Record<string, ColorSwatch>;

export type ColorId = keyof typeof COLOR_LIBRARY;
export const COLOR_COLLECTIONS = {
  "pigments": [
    "sulfur",
    "vermilion",
    "ultraviolet",
    "pool-cyan",
    "black-cherry",
    "tangerine",
    "klein-blue",
    "malachite",
    "hot-lacquer",
    "petroleum",
    "saffron",
    "silver-lilac"
  ],
  "mineral-candy-study": [
    "mineral-candy-pistachio",
    "mineral-candy-cornflower",
    "mineral-candy-iris-milk",
    "mineral-candy-guava",
    "mineral-candy-apricot"
  ],
  "sorbet-study": [
    "sorbet-melon-rind",
    "sorbet-glacier",
    "sorbet-lilac-cream",
    "sorbet-rosewater",
    "sorbet-buttercream"
  ],
  "pigment-study": [
    "pigment-pickled-pear",
    "pigment-blue-ceramic",
    "pigment-orchid-clay",
    "pigment-persimmon",
    "pigment-saffron"
  ]
} as const satisfies Record<string, readonly ColorId[]>;

/** Surface and ink travel together; pigment is for decoration, not small text. */
export function getColorPair(id: ColorId, appearance: "light" | "dark" = "light") {
  const color: ColorSwatch = COLOR_LIBRARY[id];
  return {
    surface: appearance === "dark" ? color.ink : color.surface,
    ink: appearance === "dark" ? color.surface : color.ink,
    pigment: color.pigment ?? color.surface,
  };
}
