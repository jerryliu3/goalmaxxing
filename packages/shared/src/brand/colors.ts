/**
 * The named color library from the brand studies (#964): pigments plus the
 * Mineral Candy, Sorbet, and Pigment palette studies. Authored digital
 * colors, not Pantone specifications. Goal categories draw from it
 * (categories.ts).
 */
export interface ColorSwatch {
  name: string;
  surface: string;
  ink: string;
  mist?: string;
  pigment?: string;
  shade?: string;
}

export const COLOR_LIBRARY = {
  sulfur: {
    name: "Sulfur",
    mist: "#f4f6c2",
    surface: "#e1ea83",
    pigment: "#cbdc35",
    shade: "#858f21",
    ink: "#363d10",
  },
  vermilion: {
    name: "Vermilion",
    mist: "#ffe3d4",
    surface: "#ffa583",
    pigment: "#ed582d",
    shade: "#ae3920",
    ink: "#632310",
  },
  ultraviolet: {
    name: "Ultraviolet",
    mist: "#eee5ff",
    surface: "#c4a8f5",
    pigment: "#8a4fe0",
    shade: "#5d269d",
    ink: "#351655",
  },
  "pool-cyan": {
    name: "Pool cyan",
    mist: "#d5f5f5",
    surface: "#87dbe1",
    pigment: "#19b9cd",
    shade: "#14768b",
    ink: "#123f50",
  },
  "black-cherry": {
    name: "Black cherry",
    mist: "#f9dce8",
    surface: "#de93b6",
    pigment: "#a72c64",
    shade: "#701b42",
    ink: "#3e132a",
  },
  tangerine: {
    name: "Tangerine",
    mist: "#ffe9c6",
    surface: "#ffc36d",
    pigment: "#f69729",
    shade: "#ae641a",
    ink: "#5c340b",
  },
  "klein-blue": {
    name: "Klein blue",
    mist: "#e2e6ff",
    surface: "#aabafb",
    pigment: "#3c5ddf",
    shade: "#283fab",
    ink: "#18245f",
  },
  malachite: {
    name: "Malachite",
    mist: "#d4f3dc",
    surface: "#83d3a3",
    pigment: "#219862",
    shade: "#176744",
    ink: "#103e2e",
  },
  "hot-lacquer": {
    name: "Hot lacquer",
    mist: "#ffe0ec",
    surface: "#f88fbf",
    pigment: "#e63287",
    shade: "#a62060",
    ink: "#571136",
  },
  petroleum: {
    name: "Petroleum",
    mist: "#d8eeee",
    surface: "#88bbbf",
    pigment: "#246b78",
    shade: "#164956",
    ink: "#0b2c38",
  },
  saffron: {
    name: "Saffron",
    mist: "#fff0b5",
    surface: "#f4d35e",
    pigment: "#ddb325",
    shade: "#957215",
    ink: "#4d3c0b",
  },
  "silver-lilac": {
    name: "Silver lilac",
    mist: "#f1edf7",
    surface: "#d1c9df",
    pigment: "#a39ab9",
    shade: "#726486",
    ink: "#3d334e",
  },
  "mineral-candy-pistachio": {
    name: "Pistachio",
    surface: "#c5d49a",
    ink: "#394823",
  },
  "mineral-candy-cornflower": {
    name: "Cornflower",
    surface: "#adbde5",
    ink: "#304674",
  },
  "mineral-candy-iris-milk": {
    name: "Iris milk",
    surface: "#c9b2d9",
    ink: "#573a67",
  },
  "mineral-candy-guava": {
    name: "Guava",
    surface: "#eca7a2",
    ink: "#6d323a",
  },
  "mineral-candy-apricot": {
    name: "Apricot",
    surface: "#e9bd89",
    ink: "#654220",
  },
  "sorbet-melon-rind": {
    name: "Melon rind",
    surface: "#dee6b3",
    ink: "#445329",
  },
  "sorbet-glacier": {
    name: "Glacier",
    surface: "#c9e2e7",
    ink: "#2c535b",
  },
  "sorbet-lilac-cream": {
    name: "Lilac cream",
    surface: "#ddcce9",
    ink: "#5a436f",
  },
  "sorbet-rosewater": {
    name: "Rosewater",
    surface: "#f1c6ce",
    ink: "#703e50",
  },
  "sorbet-buttercream": {
    name: "Buttercream",
    surface: "#f0dd9c",
    ink: "#65501d",
  },
  "pigment-pickled-pear": {
    name: "Pickled pear",
    surface: "#adb96b",
    ink: "#303e19",
  },
  "pigment-blue-ceramic": {
    name: "Blue ceramic",
    surface: "#819fca",
    ink: "#1c3558",
  },
  "pigment-orchid-clay": {
    name: "Orchid clay",
    surface: "#b58caf",
    ink: "#46233f",
  },
  "pigment-persimmon": {
    name: "Persimmon",
    surface: "#e59773",
    ink: "#5e2f1c",
  },
  "pigment-saffron": {
    name: "Saffron",
    surface: "#dab567",
    ink: "#5b4012",
  },
} as const satisfies Record<string, ColorSwatch>;

export type ColorId = keyof typeof COLOR_LIBRARY;

export const COLOR_COLLECTIONS = {
  pigments: [
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
    "silver-lilac",
  ],
  "mineral-candy-study": [
    "mineral-candy-pistachio",
    "mineral-candy-cornflower",
    "mineral-candy-iris-milk",
    "mineral-candy-guava",
    "mineral-candy-apricot",
  ],
  "sorbet-study": [
    "sorbet-melon-rind",
    "sorbet-glacier",
    "sorbet-lilac-cream",
    "sorbet-rosewater",
    "sorbet-buttercream",
  ],
  "pigment-study": [
    "pigment-pickled-pear",
    "pigment-blue-ceramic",
    "pigment-orchid-clay",
    "pigment-persimmon",
    "pigment-saffron",
  ],
} as const satisfies Record<string, readonly ColorId[]>;

/** Surface and ink travel together; pigment is for decoration, not small text. */
export function colorPair(id: ColorId, appearance: "light" | "dark" = "light") {
  const color: ColorSwatch = COLOR_LIBRARY[id];
  return {
    surface: appearance === "dark" ? color.ink : color.surface,
    ink: appearance === "dark" ? color.surface : color.ink,
    pigment: color.pigment ?? color.surface,
  };
}
